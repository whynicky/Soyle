#!/bin/zsh -l
# Double-click in Finder: generates the Kazakh voice tests for the Söyle film.
cd "$(dirname "$0")/../.."
echo "Söyle — генерация тестовых голосов…"
node audio/voice-tests/generate.mjs
echo
echo "Готово. Окно можно закрыть."
