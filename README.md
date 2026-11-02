# 🐧 Mój Pingwinek — test online (bez Google Calendar)

## Linki
- **Nowy MVP online:** https://thebestjob.github.io/mojpingwinek-app/online.html
- **Poprzedni Demo 3.0:** https://thebestjob.github.io/mojpingwinek-app/
- **APK demonstracyjny (stara wersja offline):** https://github.com/TheBestJob/mojpingwinek-app/actions/workflows/android-apk.yml

**Status:** nowy MVP online jest przygotowany w kodzie, ale **rejestracja, logowanie i synchronizacja nie zadziałają**, zanim właściciel skonfiguruje własny projekt Firebase. Aktualny APK nie zawiera jeszcze integracji Firebase.

## Uruchomienie środowiska testowego

1. Wejdź na https://console.firebase.google.com/ i utwórz projekt `moj-pingwinek-test` (w osobnym projekcie od przyszłej produkcji).
2. W Project settings → Your apps dodaj **Web app**. Skopiuj ustawienia Firebase do `firebase-config.js` (apiKey, authDomain, projectId, storageBucket, appId). To są identyfikatory klienta, **nie** prywatny klucz administratora.
3. Authentication → Sign-in method → włącz **Email/Password**.
4. Authentication → Settings → Authorized domains → dodaj `thebestjob.github.io` (bez protokołu i ścieżki).
5. Firestore Database → utwórz bazę, wybierając odpowiedni region UE, i opublikuj zawartość `firestore.rules` na karcie Rules. **Nie używaj reguł test mode w środowisku udostępnionym testerom.**
6. Storage → utwórz bucket, najlepiej w regionie UE, a następnie opublikuj `storage.rules` na karcie Rules. Firebase Storage może wymagać planu Blaze / dodania konta rozliczeniowego.
7. Odczekaj na publikację GitHub Pages. Otwórz https://thebestjob.github.io/mojpingwinek-app/online.html.
8. Utwórz fikcyjne konto testowe, dodaj wydarzenie i notatkę. Zaloguj się na innym urządzeniu tym samym kontem, aby sprawdzić synchronizację.
9. Przetestuj separację danych: drugie testowe konto nie powinno mieć dostępu do dokumentów i wpisów pierwszego konta.
10. Zanim dopuścisz rzeczywistych użytkowników i dane dzieci, przeprowadź audyt reguł, polityki prywatności, retencji i usuwania kont, procesu zgód, ochrony danych osobowych oraz zgodności z RODO. Rozważ MFA i weryfikację e-mail.

## Zakres MVP online

- E-mail/hasło: rejestracja, logowanie, wylogowanie, reset hasła
- Kalendarz **wewnątrz aplikacji**: dodawanie, usuwanie i synchronizacja wydarzeń przez Firestore
- Dziennik: dodawanie, usuwanie i synchronizacja notatek
- Dokumenty: przesyłanie i pobieranie plików PDF/JPG/PNG (max 10 MB), usuwanie i osobny folder użytkownika
- Firebase Security Rules dla kolekcji i bucketu
- **Brak Google Calendar, Google OAuth i dostępu do zewnętrznych kalendarzy**

## Ograniczenia przed produkcją

- Interfejs MVP online jest oddzielny od wizualnego Demo 3.0. Nie jest jeszcze połączony z aplikacją Android.
- Nie ma jeszcze automatycznych przypomnień push, udostępniania danych między opiekunami, eksportu danych ani automatycznego usuwania konta i wszystkich plików.
- Każdy uprawniony użytkownik testowy może utworzyć konto. Konieczne jest ograniczenie grona testerów i monitoring kosztów.
- Nie przesyłaj prawdziwych danych wrażliwych dzieci do tego prototypu.

## Pliki

- `online.html` — frontend web
- `online.js` — Firebase Auth / Firestore / Storage
- `firebase-config.js` — ustawienia Twojego Firebase
- `firestore.rules` — reguły dostępu do bazy
- `storage.rules` — reguły dostępu do plików
- `index.html` — dotychczasowy offline Demo 3.0
