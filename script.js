const DEFAULT_API = "https://script.google.com/macros/s/AKfycbwRXtdjZYyrKrJC8DBiRvL7AoXNYKVeMuTlygWP0tFPGIdguqzLIWaz7GESIG3vZqh7/exec";
const DEFAULT_KEY = "1552006";

const statuses = [
  "تم استلام المستندات",
  "تم إنهاء الإجراءات",
  "تم شحن السيارة",
  "وصلت ميناء سفاجا",
  "جاري التخليص الجمركي",
  "تم إنهاء الفحص",
  "تم الإفراج عن السيارة",
  "خرجت من الميناء",
  "تم التسليم"
];

document.addEventListener("DOMContentLoaded", function () {

  const year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const statusSelect = document.getElementById("carStatus");

  if (statusSelect) {
    statusSelect.innerHTML = "";

    statuses.forEach(function (status, index) {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = (index + 1) + ". " + status;
      statusSelect.appendChild(option);
    });
  }

  const apiUrl = document.getElementById("apiUrl");
  if (apiUrl) {
    apiUrl.value = DEFAULT_API;
  }

  const adminKey = document.getElementById("adminKey");
  if (adminKey) {
    adminKey.value = DEFAULT_KEY;
  }

  const saveConfig = document.getElementById("saveConfig");

  if (saveConfig) {
    saveConfig.onclick = function () {
      localStorage.setItem("kh_api", DEFAULT_API);
      localStorage.setItem("kh_key", DEFAULT_KEY);
      alert("تم حفظ إعدادات نظام المتابعة");
    };
  }

  const trackForm = document.getElementById("trackForm");

  if (trackForm) {
    trackForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const input = document.getElementById("trackCode");

      if (input) {
        showTrack(input.value.trim());
      }
    });
  }

  const saveCarButton = document.getElementById("saveCar");

  if (saveCarButton) {
    saveCarButton.onclick = saveCar;
  }
});


function apiGet(params) {

  return new Promise(function (resolve, reject) {

    const callbackName =
      "khCallback_" +
      Date.now() +
      "_" +
      Math.floor(Math.random() * 100000);

    const script = document.createElement("script");

    const url = new URL(DEFAULT_API);

    Object.entries(params).forEach(function ([key, value]) {
      url.searchParams.set(key, value);
    });

    url.searchParams.set("callback", callbackName);

    const timer = setTimeout(function () {
      cleanup();
      reject(new Error("انتهت مهلة الاتصال"));
    }, 15000);

    window[callbackName] = function (data) {
      clearTimeout(timer);
      cleanup();
      resolve(data);
    };

    script.onerror = function () {
      clearTimeout(timer);
      cleanup();
      reject(new Error("تعذر الاتصال بـ Google Apps Script"));
    };

    function cleanup() {
      delete window[callbackName];

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }

    script.src = url.toString();

    document.body.appendChild(script);
  });
}


function render(data, target) {

  if (!data || !data.ok) {

    target.innerHTML =
      '<div class="notice" style="margin-top:18px">' +
      'لم يتم العثور على الشحنة. تأكد من رقم الشحنة.' +
      '</div>';

    return;
  }

  const current = Number(data.statusIndex || 0);

  let html = `
    <div class="card status">

      <h3>
        ${escapeHtml(data.code || "")}
      </h3>

      <p>
        <b>العميل:</b>
        ${escapeHtml(data.clientName || "—")}
        <br>

        <b>السيارة:</b>
        ${escapeHtml(data.carInfo || "—")}
      </p>
  `;

  statuses.forEach(function (status, index) {

    html += `
      <div class="step ${index <= current ? "done" : ""}">

        <span class="dot"></span>

        <div>

          <strong>
            ${index + 1}. ${status}
          </strong>

          ${
            index === current
              ? '<div class="small">آخر مرحلة مسجلة</div>'
              : ""
          }

        </div>

      </div>
    `;
  });

  if (data.note) {

    html += `
      <div class="notice" style="margin-top:15px">
        ${escapeHtml(data.note)}
      </div>
    `;
  }

  if (data.updatedAt) {

    html += `
      <div class="small" style="margin-top:15px">
        آخر تحديث: ${escapeHtml(data.updatedAt)}
      </div>
    `;
  }

  html += "</div>";

  target.innerHTML = html;
}


async function showTrack(code) {

  const target =
    document.getElementById("trackResult");

  if (!target) return;

  if (!code) {

    target.innerHTML =
      '<div class="notice">اكتب رقم الشحنة أولًا.</div>';

    return;
  }

  target.innerHTML =
    '<div class="notice">جاري البحث...</div>';

  try {

    const data = await apiGet({
      action: "get",
      code: code
    });

    render(data, target);

  } catch (error) {

    console.error(error);

    target.innerHTML =
      '<div class="notice">' +
      'تعذر الاتصال بنظام المتابعة. حاول مرة أخرى.' +
      '</div>';
  }
}


async function saveCar() {

  const message =
    document.getElementById("adminMsg");

  if (!message) return;

  const codeElement =
    document.getElementById("carCode");

  const clientElement =
    document.getElementById("clientName");

  const carElement =
    document.getElementById("carInfo");

  const statusElement =
    document.getElementById("carStatus");

  const noteElement =
    document.getElementById("carNote");

  const phoneElement =
    document.getElementById("clientPhone");

  const chassisElement =
    document.getElementById("chassis");

  const code =
    codeElement ? codeElement.value.trim() : "";

  const clientName =
    clientElement ? clientElement.value.trim() : "";

  const carInfo =
    carElement ? carElement.value.trim() : "";

  const statusIndex =
    statusElement ? statusElement.value : "0";

  const note =
    noteElement ? noteElement.value.trim() : "";

  const phone =
    phoneElement ? phoneElement.value.trim() : "";

  const chassis =
    chassisElement ? chassisElement.value.trim() : "";

  if (!code) {

    message.innerHTML =
      '<div class="notice">اكتب رقم الشحنة.</div>';

    return;
  }

  message.innerHTML =
    '<div class="notice">جاري الحفظ...</div>';

  try {

    const data = await apiGet({

      action: "save",
      key: DEFAULT_KEY,
      code: code,
      clientName: clientName,
      phone: phone,
      carInfo: carInfo,
      chassis: chassis,
      statusIndex: statusIndex,
      note: note

    });

    message.innerHTML =
      '<div class="notice">' +
      escapeHtml(
        data.message || "تم الحفظ بنجاح"
      ) +
      '</div>';

  } catch (error) {

    console.error(error);

    message.innerHTML =
      '<div class="notice">' +
      'تعذر حفظ الشحنة. تأكد من إعدادات النظام.' +
      '</div>';
  }
}


function escapeHtml(value) {

  return String(value ?? "").replace(
    /[&<>"']/g,
    function (character) {

      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

      }[character];

    }
  );
}      <h3>${escapeHtml(data.code || "")}</h3>
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
