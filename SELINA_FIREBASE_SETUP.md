# Selina – Firebase Realtime Database (zusätzlich zu bestehenden Regeln)

Unter dem vorhandenen Objekt `rules` ergänzen, ohne andere Einträge zu löschen:

```json
"selinaMath": {
  "$uid": {
    ".read": "auth != null && auth.uid === $uid",
    ".write": "auth != null && auth.uid === $uid && newData.exists()",
    ".validate": "newData.hasChildren(['records','errors'])"
  }
}
```

Voraussetzungen: Firebase Authentication → Sign-in method → E-Mail/Passwort aktivieren und ein separates Konto für Selinas Mathe erstellen. Auf Kinder- und Schiedsrichter-Seite einmalig dieselben Kontodaten eingeben. Nicht das vorhandene Schiedsrichter-Konto von Vocab-Battle verwenden. Die Regeln werden nicht durch GitHub Pages veröffentlicht; sie müssen in der Firebase Console separat veröffentlicht werden.

Vor dem ersten Login die bestehenden lokalen Daten auf dem Kinder-Gerät nicht löschen. Der erste erfolgreiche Login führt vorhandene lokale Datensätze mit den Cloud-Daten zusammen. Anschließend muss die Anzeige auf beiden App-Seiten geprüft werden.
