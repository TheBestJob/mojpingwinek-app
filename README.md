# 🐧 Mój Pingwinek — Demo 3.0

**Interaktywny demo-web:** https://thebestjob.github.io/mojpingwinek-app/

**APK na Androida:** https://github.com/TheBestJob/mojpingwinek-app/actions/workflows/android-apk.yml — wybierz ostatni zielony run, pobierz `MojPingwinek-demo-APK`, rozpakuj ZIP i zainstaluj plik `app-debug.apk`.

## Funkcje prototypu

- Interfejs mobilny inspirowany oryginalnymi projektami Stitch: typografia Atkinson Hyperlegible Next, niebiesko-turkusowa paleta, wyraźne karty
- Nawigacja dolna oraz ekran główny z profilem demonstracyjnym
- Dokumenty: wyszukiwarka, filtrowanie i szczegóły przykładowych dokumentów
- Kalendarz miesięczny, dodawanie i usuwanie demonstracyjnych wydarzeń
- Dziennik obserwacji, dodawanie i usuwanie wpisów demonstracyjnych
- Paszport medyczny, specjaliści, wsparcie rodzica, formalności i powiadomienia
- Wyczyść dane demonstracyjne w Ustawieniach
- Jeden interfejs w wersji browser i offline APK (lokalne zasoby WebView)

## Ograniczenia

**To nie jest jeszcze aplikacja produkcyjna.** Brak logowania, Firebase, synchronizacji między urządzeniami oraz możliwości faktycznego przesyłania dokumentów. Wpisy z formularzy zapisują się w nieszyfrowanym `localStorage` danego urządzenia. Nie wpisuj prawdziwych danych dzieci ani danych medycznych. Repozytorium jest publiczne.

## Kolejny etap

Przygotowanie produkcyjnej architektury bezpieczeństwa, uwierzytelniania i backendu przed przechowywaniem danych wrażliwych.
