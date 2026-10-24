# 🐧 Mój Pingwinek — Demo 2.0

**Klikalny pokaz aplikacji (bez instalacji):** https://thebestjob.github.io/mojpingwinek-app/

**Android APK:** https://github.com/TheBestJob/mojpingwinek-app/actions/workflows/android-apk.yml — otwórz najnowszy udany build i pobierz artefakt `MojPingwinek-demo-APK`. W ZIP znajduje się plik `app-debug.apk`.

## Co działa w demo

- Ekran główny, menu dolne i nawigacja
- Dokumenty i paszport medyczny (wyłącznie przykładowe)
- Kalendarz: lokalne dodawanie demonstracyjnych wydarzeń
- Dziennik: lokalne dodawanie demonstracyjnych obserwacji
- Specjaliści, wsparcie rodzica, plan szkolny, kontakty i powiadomienia

### Ważne

To **prototyp interfejsu** — nie jest podłączony do Firebase ani produkcyjnej bazy danych. Wpisy demonstracyjne przechowywane są w localStorage danego urządzenia/przeglądarki; nie synchronizują się pomiędzy urządzeniami. Nie wprowadzaj prawdziwych danych osobowych ani medycznych.

## Budowanie APK

GitHub Actions: `.github/workflows/android-apk.yml`. Każdy push do `main` uruchamia automatyczny debug build APK. Publikacja w Google Play będzie wymagała podpisanego pakietu AAB i odrębnego przygotowania wersji produkcyjnej.
