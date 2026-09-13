const DEFAULT_API = "https://script.google.com/macros/s/AKfycbwRXtdjZYyrKrJC8DBiRvL7AoXNYKVeMuTlygWP0tFPGIdguqzLIWaz7GESIG3vZqh7/exec";
const DEFAULT_KEY = "1552006";

const statuses = [
  "تم استلام المستندات",
  "تم إنهاء الإجراءات",
  "تم شحن السيارة",
  "وصلت ميناء سفاجا",
  "جاري التخليص الجمركي",
  "تم إنهاء الفحص",
  "تم تسجيل 46",
  "تم إنهاء المعاينة",
  "تم إنهاء التتمين",
  "تم الاعتماد",
  "تم دفع الفاتورة",
  "تم تسليم الإخطار",
  "تم الإفراج عن السيارة",
  "خرجت من الميناء",
  "تم التسليم"
];

document.addEventListener("DOMContentLoaded", () => {

  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  const sel = document.getElementById("carStatus");

  if (sel) {
    statuses.forEach((s, i) => {
      const o = document.createElement("option");
      o.value = i;
      o.textContent = (i + 1) + ". " + s;
      sel.appendChild(o);
    });
  }

  const cfg = document.getElementById("apiUrl");
  if (cfg) cfg.value = DEFAULT_API;

  const key = document.getElementById("adminKey");
  if (key) key.value = DEFAULT_KEY;

  const save = document.getElementById("saveConfig");

  if (save) {
    save.onclick = () => {
      localStorage.setItem("kh_api", DEFAULT_API);
      localStorage.setItem("kh_key", DEFAULT_KEY);
      alert("تم حفظ إعدادات نظام المتابعة");
    };
  }

  const sf = document.getElementById("trackForm");

  if (sf) {
    sf.addEventListener("submit", async e => {
      e.preventDefault();
      showTrack(
        document.getElementById("trackCode").value.trim()
      );
    });
  }

  const sb = document.getElementById("saveCar");

  if (sb) {
    sb.onclick = saveCar;
  }
});

async function apiGet(params) {

  const url = DEFAULT_API;

  if (!url) {
    throw new Error("رابط نظام المتابعة غير موجود");
  }

  const u = new URL(url);

  Object.entries(params).forEach(([k, v]) => {
    u.searchParams.set(k, v);
  });

  const r = await fetch(
    u.toString(),
    {
      method: "GET",
      cache: "no-store"
    }
  );

  return await r.json();
}

function render(data, target) {

  if (!data || !data.ok) {

    target.innerHTML =
      '<div class="notice" style="margin-top:18px">' +
      'لم يتم العثور على الملف. تأكد من رقم الشحنة.' +
      '</div>';

    return;
  }

  const current = Number(data.statusIndex || 0);

  let h =
    `<div class="card status">
      <h3>${escapeHtml(data.code || "")}</h3>
      <p>
        <b>العميل:</b> ${escapeHtml(data.clientName || "—")}<br>
        <b>السيارة:</b> ${escapeHtml(data.carInfo || "—")}
      </p>`;

  statuses.forEach((s, i) => {

    h += `
      <div class="step ${i <= current ? "done" : ""}">
        <span class="dot"></span>
        <div>
          <strong>${i + 1}. ${s}</strong>
          ${
            i === current
              ? '<div class="small">آخر مرحلة مسجلة</div>'
              : ""
          }
        </div>
      </div>
    `;
  });

  if (data.note) {

    h += `
      <div class="notice" style="margin-top:15px">
        ${escapeHtml(data.note)}
      </div>
    `;
  }

  h += "</div>";

  target.innerHTML = h;
}

async function showTrack(code) {

  const t = document.getElementById("trackResult");

  if (!t) return;

  t.innerHTML =
    '<div class="notice">جاري البحث...</div>';

  try {

    const data = await apiGet({
      action: "get",
      code: code
    });

    render(data, t);

  } catch (e) {

    t.innerHTML =
      '<div class="notice">' +
      'تعذر الاتصال بنظام المتابعة. حاول مرة أخرى.' +
      '</div>';
  }
}

async function saveCar() {

  const msg = document.getElementById("adminMsg");

  if (!msg) return;

  msg.innerHTML =
    '<div class="notice">جاري الحفظ...</div>';

  try {

    const data = await apiGet({

      action: "save",

      key: DEFAULT_KEY,

      code:
        document.getElementById("carCode").value.trim(),

      clientName:
        document.getElementById("clientName").value.trim(),

      phone:
        document.getElementById("clientPhone")
          ? document.getElementById("clientPhone").value.trim()
          : "",

      carInfo:
        document.getElementById("carInfo").value.trim(),

      chassis:
        document.getElementById("chassis")
          ? document.getElementById("chassis").value.trim()
          : "",

      statusIndex:
        document.getElementById("carStatus").value,

      note:
        document.getElementById("carNote").value.trim()
    });

    msg.innerHTML =
      `<div class="notice">
        ${escapeHtml(data.message || "تم الحفظ")}
      </div>`;

  } catch (e) {

    msg.innerHTML =
      '<div class="notice">' +
      'تعذر الاتصال بنظام المتابعة. تأكد أن نشر Apps Script يعمل.' +
      '</div>';
  }
}

function escapeHtml(s) {

  return String(s ?? "").replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m])
  );
     }
