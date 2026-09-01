#!/bin/bash
# Auto-player: finds valid moves via DOM, drags them, until win modal or max moves.
set -e
cd /home/z/my-project
AB="agent-browser"

for i in $(seq 1 30); do
  # check for win modal first
  MODAL=$($AB eval "(()=>{const d=document.querySelector('[role=dialog]');return d?d.textContent.slice(0,40):'none'})()")
  if [[ "$MODAL" != *"none"* ]]; then
    echo "MODAL: $MODAL"
    break
  fi
  MOVE=$($AB eval "(()=>{const tiles=[...document.querySelector('[role=application]').children].map(el=>{const i=el.querySelector&&el.querySelector('img');if(!i||!/tile-[a-z]+/.test(i.src)||!el.style)return null;const m=el.style.transform.match(/translate\\(([-0-9.]+)%,\\s*([-0-9.]+)%\\)/);if(!m)return null;return {r:Math.round(parseFloat(m[2])/100),c:Math.round(parseFloat(m[1])/100),type:(i.src.match(/tile-([a-z]+)/)||[])[1]}}).filter(Boolean);if(tiles.length<64)return 'busy';const g=Array.from({length:8},()=>Array(8).fill('--'));tiles.forEach(t=>g[t.r][t.c]=t.type);const ok=(gg,r,c)=>{const t=gg[r][c];let n=1;for(let i=c-1;i>=0&&gg[r][i]===t;i--)n++;for(let i=c+1;i<8&&gg[r][i]===t;i++)n++;if(n>=3)return true;n=1;for(let i=r-1;i>=0&&gg[i][c]===t;i--)n++;for(let i=r+1;i<8&&gg[i][c]===t;i++)n++;return n>=3};for(let r=0;r<8;r++)for(let c=0;c<8;c++){for(const d of[[0,1],[1,0]]){const r2=r+d[0],c2=c+d[1];if(r2>7||c2>7)continue;const gg=g.map(row=>row.slice());const tmp=gg[r][c];gg[r][c]=gg[r2][c2];gg[r2][c2]=tmp;if(ok(gg,r,c)||ok(gg,r2,c2)){const rc=document.querySelector('[role=application]').getBoundingClientRect();return JSON.stringify({a:{r,c},b:{r:r2,c:c2},x:rc.x,y:rc.y,w:rc.width,h:rc.height})}}}return 'nomove'})()")
  if [[ "$MOVE" == "busy" ]]; then sleep 1.2; continue; fi
  if [[ "$MOVE" == "nomove" ]]; then echo "NOMOVE at iter $i (waiting for reshuffle)"; sleep 1.5; continue; fi
  # parse move and drag
  read -r AX AY BX BY <<< "$(python3 -c "
import json,sys
raw='''$MOVE'''.strip().strip('\"').replace('\\\\\"','\"')
m=json.loads(raw)
cw=m['w']/8; ch=m['h']/8
print(round(m['x']+(m['a']['c']+0.5)*cw), round(m['y']+(m['a']['r']+0.5)*ch), round(m['x']+(m['b']['c']+0.5)*cw), round(m['y']+(m['b']['r']+0.5)*ch))
")"
  $AB mouse move $AX $AY >/dev/null
  $AB mouse down left >/dev/null
  $AB mouse move $(( (AX+BX)/2 )) $(( (AY+BY)/2 )) >/dev/null
  $AB mouse move $BX $BY >/dev/null
  $AB mouse up left >/dev/null
  sleep 2.4
  SCORE=$($AB eval "document.querySelector('[aria-live=polite]').textContent")
  echo "move $i: ($AX,$AY)->($BX,$BY) score=$SCORE"
done
$AB screenshot extracted/e2e_15_endgame.png >/dev/null
echo "--- final state ---"
$AB eval "(()=>{const d=document.querySelector('[role=dialog]');return JSON.stringify({dialog: d?d.textContent.slice(0,120):null, score: document.querySelector('[aria-live=polite]').textContent})})()"
