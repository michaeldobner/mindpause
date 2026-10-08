#!/usr/bin/env bash
# Legt die Anwendung für MIND PAUSE in Coolify an und rollt sie aus.
#
# Einmalig nötig. Danach übernimmt die GitHub App in Coolify das Ausrollen,
# oder .github/workflows/deploy.yml, siehe README.
#
# Ohne --yes zeigt das Skript nur, was es senden würde, und ändert nichts.
#
#   COOLIFY_URL=https://coolify.example.com \
#   COOLIFY_API_KEY='…' \
#   bash deploy/coolify-create.sh \
#     --server-uuid …  --project-uuid …  --github-app-uuid …  \
#     --domain https://spiele.example.com  --yes
#
# Die UUIDs stehen in Coolify. Die der GitHub App liefert manche Version nicht
# über die API, sie steht dann in der Adresszeile, wenn man die Source öffnet.

set -euo pipefail

REPO=michaeldobner/mindpause
BRANCH=main
NAME=mindpause
UMGEBUNG=production
# Ohne festen Wert: das Repository ist öffentlich, diese Angaben kommen als Parameter
SERVER=
PROJEKT=
GITHUB_APP=
DOMAIN=
ERNST=0

while [ $# -gt 0 ]; do
  case "$1" in
    --server-uuid)     SERVER="$2"; shift 2 ;;
    --project-uuid)    PROJEKT="$2"; shift 2 ;;
    --github-app-uuid) GITHUB_APP="$2"; shift 2 ;;
    --environment-name) UMGEBUNG="$2"; shift 2 ;;
    --domain)          DOMAIN="$2"; shift 2 ;;
    --repo)            REPO="$2"; shift 2 ;;
    --branch)          BRANCH="$2"; shift 2 ;;
    --name)            NAME="$2"; shift 2 ;;
    --yes)             ERNST=1; shift ;;
    *) echo "Unbekannter Parameter: $1" >&2; exit 2 ;;
  esac
done

: "${COOLIFY_URL:?COOLIFY_URL fehlt}"
: "${COOLIFY_API_KEY:?COOLIFY_API_KEY fehlt}"
for p in SERVER:--server-uuid PROJEKT:--project-uuid DOMAIN:--domain; do
  name="${p%%:*}"; flag="${p#*:}"
  [ -n "${!name}" ] || { echo "$flag fehlt" >&2; exit 2; }
done

BASIS="${COOLIFY_URL%/}/api/v1"
api() { # api <methode> <pfad> [daten]
  local m="$1" p="$2" d="${3-}"
  if [ -n "$d" ]; then
    curl -sS --max-time 90 -X "$m" -H "Authorization: Bearer $COOLIFY_API_KEY" \
      -H "Content-Type: application/json" -H "Accept: application/json" -d "$d" "$BASIS$p"
  else
    curl -sS --max-time 90 -X "$m" -H "Authorization: Bearer $COOLIFY_API_KEY" \
      -H "Accept: application/json" "$BASIS$p"
  fi
}
feld() { python3 -c 'import json,sys
try: d=json.load(sys.stdin)
except Exception: sys.exit()
print(d.get(sys.argv[1],"") if isinstance(d,dict) else "")' "$1"; }

# Die UUID der GitHub App, falls die API sie hergibt
if [ -z "$GITHUB_APP" ]; then
  GITHUB_APP=$(api GET /github-apps | python3 -c 'import json,sys
try: d=json.load(sys.stdin)
except Exception: sys.exit()
if isinstance(d,list) and d: print(d[0].get("uuid",""))' || true)
  [ -n "$GITHUB_APP" ] || { echo "Die UUID der GitHub App liefert diese Coolify-Version nicht über die API. Bitte mit --github-app-uuid angeben, sie steht in der Adresszeile der Source." >&2; exit 2; }
  echo "GitHub App aus der API: $GITHUB_APP"
fi

# Gibt es die Anwendung schon? Dann nicht ein zweites Mal anlegen.
VORHANDEN=$(api GET /applications | python3 -c 'import json,sys
try: d=json.load(sys.stdin)
except Exception: sys.exit()
if isinstance(d,list):
    for a in d:
        if isinstance(a,dict) and sys.argv[1] in str(a.get("git_repository","")):
            print(a.get("uuid","")); break' "$REPO" || true)

RUMPF=$(python3 -c 'import json,sys
k=["project_uuid","server_uuid","environment_name","github_app_uuid","git_repository","git_branch","build_pack","ports_exposes","domains","name","dockerfile_location","health_check_enabled","health_check_path","instant_deploy"]
v=[sys.argv[1],sys.argv[2],sys.argv[3],sys.argv[4],sys.argv[5],sys.argv[6],"dockerfile","80",sys.argv[7],sys.argv[8],"/Dockerfile",True,"/healthz",False]
print(json.dumps(dict(zip(k,v)),indent=2,ensure_ascii=False))' \
  "$PROJEKT" "$SERVER" "$UMGEBUNG" "$GITHUB_APP" "$REPO" "$BRANCH" "$DOMAIN" "$NAME")

echo
echo "POST $BASIS/applications/private-github-app"
echo "$RUMPF"
echo

if [ -n "$VORHANDEN" ]; then
  echo "Es gibt bereits eine Anwendung für $REPO (uuid=$VORHANDEN). Es wird keine zweite angelegt."
  echo "Zum Ausrollen: curl -H \"Authorization: Bearer \$COOLIFY_API_KEY\" \"$BASIS/deploy?uuid=$VORHANDEN\""
  exit 0
fi

if [ "$ERNST" -eq 0 ]; then
  echo "Vorschau. Nichts gesendet. Zum Anlegen dieselbe Zeile mit --yes wiederholen."
  exit 0
fi

ANTWORT=$(api POST /applications/private-github-app "$RUMPF")
echo "Antwort: $ANTWORT"
APP=$(printf '%s' "$ANTWORT" | feld uuid)
[ -n "$APP" ] || { echo "Coolify hat keine uuid zurückgegeben, siehe Antwort oben." >&2; exit 1; }
echo "Anwendung angelegt: $APP"

echo "Deploy wird angestoßen."
api GET "/deploy?uuid=$APP&force=false"; echo
echo
echo "Fertig. Der Build läuft in Coolify, danach ist $DOMAIN erreichbar."
