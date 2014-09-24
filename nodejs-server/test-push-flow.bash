HOST="http://ffpush.dev.coolaj86.com:8080"
URL="http://requestb.in/17g481p1"
ID="${1}"

register() {
curl "${HOST}/api/push" \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{ "url": "'${URL}'" }'
}

check() {
curl "${HOST}/api/push/${ID}" \
  -X GET
}

push() {
curl "${HOST}/api/push/${ID}" \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{ "foo": "bar", "baz": 42 }'
}

retrieve() {
curl "${HOST}/api/push/${ID}/data" \
  -X GET
}

register
echo ""
sleep 0.5
check
echo ""
sleep 0.5
push &
echo ""
sleep 0.5
retrieve
echo ""
sleep 0.5
echo ""
