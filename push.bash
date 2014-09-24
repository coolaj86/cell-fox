#!/bin/bash
PID="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=="
VERSION="0"
curl "https://updates.push.services.mozilla.com/update/${PID}" \
  -v \
  -X PUT \
  -d "version=${VERSION}"
