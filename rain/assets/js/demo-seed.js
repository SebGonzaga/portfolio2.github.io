/* RAIN showcase — sample data for the in-browser demo database.
   Everything here is invented for demonstration. Times are relative to
   "now" so the pages never look stale. See supabase-client.js. */
function RAIN_SEED(now) {
  const H = 36e5, D = 24 * H, ago = (ms) => new Date(now - ms).toISOString(), ahead = (ms) => new Date(now + ms).toISOString();
  const A = "demo-admin", R = "demo-resident";
  const brgys = ["Poblacion Barangay 3", "Sambat", "Darasa", "Janopol", "Bagbag", "Banadero", "Trapiche", "Wawa", "Natatas", "Talaga", "Santor", "Ulango"];
  const names = ["Maria Santos", "Jose Reyes", "Ana Dela Cruz", "Luis Mendoza", "Carla Bautista", "Rico Villanueva", "Joy Aquino", "Paolo Cruz", "Tess Ramos", "Ben Castillo"];
  const profiles = [
    { id: A, full_name: "Demo Administrator", email: "admin@demo.rain", barangay: "Poblacion Barangay 3", role: "admin", status: "active", created_at: ago(90 * D) },
    { id: R, full_name: "Demo Resident", email: "resident@demo.rain", barangay: "Sambat", role: "resident", status: "active", created_at: ago(60 * D) },
    ...names.map((n, i) => ({ id: "u" + i, full_name: n, email: n.toLowerCase().replace(/[^a-z]+/g, ".") + "@example.com", barangay: brgys[i + 2 > 11 ? i - 9 : i + 2], role: "resident", status: i === 7 ? "suspended" : "active", created_at: ago((5 + i * 13) * D) })),
  ];
  const alerts = [
    { id: "a1", title: "Heavy rainfall warning", type: "Flood", severity: "warning", area: "Tanauan City, Batangas", lat: 14.086, lng: 121.15, message: "Moderate to heavy rain is expected over the next 6 hours. Low-lying barangays near Taal Lake should prepare to move to higher ground.", starts_at: ago(2 * H), expires_at: ahead(10 * H), created_at: ago(2 * H), created_by: A },
    { id: "a2", title: "Taal Volcano: Alert Level 1", type: "Volcanic", severity: "advisory", area: "Taal Volcano Island", lat: 14.002, lng: 120.993, message: "Low-level unrest. Entry into the Taal Volcano Island is prohibited. Residents near the lakeshore should stay informed.", starts_at: ago(1 * D), expires_at: ahead(5 * D), created_at: ago(1 * D), created_by: A },
    { id: "a3", title: "Heat index in the 'danger' range", type: "General Emergency", severity: "warning", area: "Batangas", lat: 13.94, lng: 121.15, message: "Heat index may reach 42°C this afternoon. Drink water, avoid direct sun between 10 AM and 4 PM.", starts_at: ago(5 * H), expires_at: ahead(7 * H), created_at: ago(5 * H), created_by: A },
    { id: "a4", title: "Evacuation drill reminder", type: "General Emergency", severity: "information", area: "Poblacion Barangay 1–7", lat: 14.09, lng: 121.15, message: "Barangay-wide earthquake and fire drill this Saturday, 9 AM. Participation is voluntary but encouraged.", starts_at: ago(1 * H), expires_at: ahead(3 * D), created_at: ago(1 * H), created_by: A },
    { id: "a5", title: "Landslide watch — upland roads", type: "Landslide", severity: "critical", area: "Upland barangays", lat: 14.06, lng: 121.17, message: "Saturated slopes after prolonged rain. Avoid steep roads and riverbanks; report cracks or moving soil.", starts_at: ago(8 * H), expires_at: ahead(16 * H), created_at: ago(8 * H), created_by: A },
  ];
  const inc = (id, cat, area, brgy, desc, status, lat, lng, h, extra) => ({ id, reporter_id: id === "i1" ? R : "u" + (h % 10), title: cat + " reported", category: cat, description: desc, area, barangay: brgy, lat, lng, photo_url: null, status, created_at: ago(h * H), updated_at: ago(h * H), archived_at: null, assigned_to: null, ...extra });
  const incidents = [
    inc("i1", "Flooding", "Sambat Creek", "Sambat", "Water is knee-deep along the creek road; two tricycles stalled.", "pending", 14.0902, 121.1458, 1),
    inc("i2", "Flooding", "Darasa crossing", "Darasa", "Drainage overflow, road partly passable.", "verified", 14.0766, 121.1572, 4, { assigned_to: A }),
    inc("i3", "Landslide", "Upland road, Janopol", "Janopol", "Small soil slip blocking one lane; no injuries.", "verified", 14.0549, 121.1695, 7, { assigned_to: A }),
    inc("i4", "Gas smell", "Near lakeshore, Wawa", "Wawa", "Faint rotten-egg smell in the early morning.", "pending", 14.0705, 121.1241, 9),
    inc("i5", "Ground cracks", "Banadero", "Banadero", "Hairline cracks across the concrete path behind the chapel.", "pending", 14.1021, 121.1389, 12),
    inc("i6", "Ashfall", "Talaga", "Talaga", "Light dusting of fine grey ash on parked vehicles.", "resolved", 14.0668, 121.1297, 30),
    inc("i7", "Earthquake damage", "Poblacion Barangay 2", "Poblacion Barangay 2", "Wall of an old store has a diagonal crack after last night's tremor.", "resolved", 14.0861, 121.1503, 52),
    inc("i8", "Flooding", "Bagbag", "Bagbag", "Flash flooding in the market alley, receded after an hour.", "dismissed", 14.0954, 121.1344, 70),
    inc("i9", "Other", "Trapiche", "Trapiche", "Fallen electric pole leaning over the road.", "verified", 14.0803, 121.1612, 20, { assigned_to: A }),
    inc("i10", "Flooding", "Santor", "Santor", "Rice paddies and the feeder road under water.", "pending", 14.0738, 121.1088, 3),
  ];
  const mq = (id, type, b, days, status, desc) => ({ id, report_type: type, barangay: b, observed_on: new Date(now - days * D).toISOString().slice(0, 10), status, reporter_id: "u" + (days % 10), description: desc, lat: null, lng: null, photo_url: null, created_at: ago(days * D) });
  const mosquito_reports = [
    mq("m1", "stagnant_water", "Sambat", 1, "pending", "Old tires holding rainwater behind the vulcanizing shop."),
    mq("m2", "breeding_site", "Darasa", 2, "pending", "Wriggling larvae in an uncovered water drum."),
    mq("m3", "sighting", "Poblacion Barangay 3", 3, "verified", "Many day-biting mosquitoes near the school."),
    mq("m4", "stagnant_water", "Janopol", 4, "verified", "Clogged canal with standing water."),
    mq("m5", "breeding_site", "Sambat", 5, "verified", "Flower pots with water under the stairs."),
    mq("m6", "sighting", "Banadero", 6, "verified", ""),
    mq("m7", "stagnant_water", "Darasa", 8, "verified", "Puddle in vacant lot."),
    mq("m8", "sighting", "Bagbag", 11, "rejected", "Duplicate report."),
    mq("m9", "breeding_site", "Trapiche", 14, "verified", "Discarded containers in a backyard."),
    mq("m10", "sighting", "Sambat", 20, "verified", ""),
  ];
  const chat_logs = Array.from({ length: 90 }, (_, k) => ({ id: "c" + k, user_id: k % 3 ? R : "u" + (k % 10), created_at: ago(((k * 7) % 160) * D / 6) }));
  const typhoon_bulletins = [{
    id: "t1", storm_name: "Sample Storm (demo data)", local_name: "Demo", bulletin_no: "5", issued_at: ago(3 * H), expires_at: ahead(9 * H), lat: 15.6, lng: 124.8,
    intensity: "Tropical storm", max_wind_kph: 75, movement: "West-northwest at 20 km/h", signal_areas: "Signal No. 1 over parts of Southern Luzon (sample)",
    summary: "This is invented sample data shown in the portfolio demo. In the live app an administrator copies the current PAGASA bulletin here and can post a matching alert.",
    source_url: "https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin", created_at: ago(3 * H), created_by: A }];
  const volcano_status = [{
    id: "v1", volcano: "Taal", alert_level: 1, bulletin_issued_at: ago(1 * D), headline: "Low-level unrest (sample entry)",
    summary: "Sample entry for the demo. In the live app an administrator records the alert level from the official PHIVOLCS bulletin; entering it is a manual, verified step.",
    source_url: "https://www.phivolcs.dost.gov.ph/", created_at: ago(1 * D), created_by: A }];
  const dstamp = new Date(now - 6 * H).toLocaleDateString("en-PH", { day: "numeric", month: "long", year: "numeric" });
  const ai_digests = [
    { id: "d1", kind: "volcano", status: "ok", digest_date: new Date(now).toISOString().slice(0, 10), created_at: ago(6 * H), source_fetched_at: ago(6 * H), source_url: "https://wovodat.phivolcs.dost.gov.ph/bulletin/list-of-bulletin", alert_level: 1, image_url: null,
      summary: "SAMPLE SUMMARY (demo data): Taal remains at Alert Level 1. Gas emission from the main crater lake was measured, and a small number of volcanic earthquakes were recorded. No eruption is expected, but entry into the volcano island stays prohibited.\n\nThe live app writes this plain-language summary each night from the public PHIVOLCS bulletin; this card only shows how it looks.",
      metrics: { alert_level: 1, alert_label: "Abnormal (low-level unrest)", bulletin_date: "sample data, " + dstamp,
        so2: { v: "1,250 tonnes/day", d: "sample" }, temperature: { v: "33.4 °C", d: "sample" }, acidity: { v: "0.4 pH", d: "sample" },
        seismicity: { v: "3 volcanic earthquakes, 0 volcanic tremors", d: "sample" }, plume: { v: "Weak emission, 300 m high, drifted southwest", d: "sample" } } },
    { id: "d2", kind: "heat", status: "ok", digest_date: new Date(now).toISOString().slice(0, 10), created_at: ago(6 * H), source_fetched_at: ago(6 * H), source_url: "https://www.pagasa.dost.gov.ph/", alert_level: null, image_url: null, metrics: null,
      summary: "SAMPLE SUMMARY (demo data): The heat index in Batangas may reach the 'danger' range this afternoon. Drink water often, rest in shade, and avoid hard outdoor work between 10 AM and 4 PM. Check on children, older adults and anyone who works outdoors.\n\nThe live app writes this note each night from the public PAGASA heat index bulletin." },
  ];
  return { profiles, alerts, incidents, mosquito_reports, chat_logs, typhoon_bulletins, volcano_status, ai_digests };
}
