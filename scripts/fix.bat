@echo off
git add -A
git commit -m "fix: pass weekStart/today as strings to avoid UTC timezone shift on client"
git push
