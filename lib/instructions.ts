export function getGuidelinesImage(): string {
    return `
  Kérlek, az alábbi képalapú számlákból olvasd ki az összes releváns adatot, és add vissza az eredményt pontosan az alábbi JSON struktúrában, magyar nyelven:
  
  {
    "invoice_data": [
      {
        "név": "",
        "mennyiség": "",
        "egység ár": "",
        "nettó": "",
        "bruttó": ""
      }
    ]
  }
  
  🔁 Több termék esetén ismételd a JSON tömb elemeit.
  🧾 Ha nincs valamelyik mező, hagyd üresen.
  ⚠️ Csak JSON-t adj vissza, magyarázat vagy szöveg nélkül!
  
  Példa helyes kimenetre:
  {
    "invoice_data": [
      {
        "név": "iPhone 13",
        "mennyiség": "2",
        "egység ár": "350000",
        "nettó": "700000",
        "bruttó": "889000"
      },
      {
        "név": "Lightning kábel",
        "mennyiség": "1",
        "egység ár": "3990",
        "nettó": "3990",
        "bruttó": "5067"
      }
    ]
  }
    `.trim();
  }
  
  export function getGuidelinesText(): string {
    return `
  Kérlek, az alábbi szövegalapú PDF számlából olvasd ki az összes termékre vonatkozó adatot, és add vissza az eredményt pontosan az alábbi JSON struktúrában:
  
  {
    "invoice_data": [
      {
        "név": "",
        "mennyiség": "",
        "egység ár": "",
        "nettó": "",
        "bruttó": ""
      }
    ]
  }
  
  ✅ Magyar nyelven dolgozz.
  🧾 Több termék esetén bővítsd a JSON tömböt.
  ❌ Ne adj vissza magyarázatot, csak a JSON-t.
  📄 Az adatok a számlában előfordulhatnak külön oszlopban vagy szövegként.
  
  Példa:
  {
    "invoice_data": [
      {
        "név": "Dell laptop",
        "mennyiség": "1",
        "egység ár": "220000",
        "nettó": "220000",
        "bruttó": "279400"
      }
    ]
  }
    `.trim();
  }
  