// ===============================
// شركة الخوارزمي - Main Script
// ===============================

const API =
  "https://script.google.com/macros/s/AKfycbwRXtdjZYyrKrJC8DBiRvL7AoXNYKVeMuTlygWP0tFPGIdguqzLIWaz7GESIG3vZqh7/exec";

const STATUSES = [
  "تم استلام المستندات",
  "جاري مراجعة المستندات",
  "تم التسجيل المسبق للشحنة (ACID)",
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

  // ===============================
  // Mobile Menu
  // ===============================

  const menuBtn = document.getElementById("menuBtn");
  const nav = document.getElementById("mainNav");

  if (menuBtn && nav) {

    menuBtn.addEventListener("click", function (e) {
      e.stopPropagation();

      const isOpen = nav.classList.toggle("open");

      menuBtn.setAttribute(
        "aria-expanded",
        isOpen ? "true" : "false"
      );
    });

    // إغلاق القائمة عند الضغط على أي رابط
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });

    // إغلاق القائمة عند الضغط خارجها
    document.addEventListener("click", function (e) {
      if (
        nav.classList.contains("open") &&
        !nav.contains(e.target) &&
        !menuBtn.contains(e.target)
      ) {
        nav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });

  }


  // ===============================
  // Lead Form
  // ===============================

  const leadForm = document.getElementById("leadForm");

  if (leadForm) {

    leadForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = getValue("leadName");
      const phone = getValue("leadPhone");
      const car = getValue("leadCar");
      const model = getValue("leadModel");
      const year = getValue("leadYear");
      const country = getValue("leadCountry");
      const service = getValue("leadService");
      const note = getValue("leadNote");

      if (!name || !phone) {
        showLeadMessage("من فضلك اكتب الاسم ورقم الهاتف أو الواتساب.");
        return;
      }

      let message =
        "السلام عليكم، أريد الاستفسار عن تخليص سيارة.%0A%0A" +
        "الاسم: " + encodeURIComponent(name) + "%0A" +
        "رقم الهاتف/واتساب: " + encodeURIComponent(phone) + "%0A" +
        "نوع السيارة: " + encodeURIComponent(car) + "%0A" +
        "الموديل: " + encodeURIComponent(model) + "%0A" +
        "سنة الصنع: " + encodeURIComponent(year) + "%0A" +
        "بلد السيارة: " + encodeURIComponent(country) + "%0A" +
        "الخدمة المطلوبة: " + encodeURIComponent(service) + "%0A" +
        "ملاحظات: " + encodeURIComponent(note);

      const whatsapp =
        "https://wa.me/201003299254?text=" + message;

      window.open(whatsapp, "_blank");

      showLeadMessage("تم تجهيز طلبك، وسيتم فتح واتساب لإرسال البيانات.");
    });

  }


  // ===============================
  // Tracking Form
  // ===============================

  const trackForm = document.getElementById("trackForm");

  if (trackForm) {

    trackForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const code = getValue("trackCode");

      if (!code) {
        showTrackMessage("من فضلك أدخل رقم الشحنة.");
        return;
      }

      trackShipment(code);
    });

  }


  // ===============================
  // تحويل رقم الشحنة إلى حروف كبيرة
  // ===============================

  const trackCode = document.getElementById("trackCode");

  if (trackCode) {

    trackCode.addEventListener("input", function () {
      this.value = this.value.toUpperCase();
    });

  }

});


// ===============================
// Get Value
// ===============================

function getValue(id) {
  const element = document.getElementById(id);

  if (!element) {
    return "";
  }

  return String(element.value || "").trim();
}


// ===============================
// Lead Message
// ===============================

function showLeadMessage(message) {

  const box = document.getElementById("leadMsg");

  if (!box) {
    return;
  }

  box.textContent = message;
  box.style.display = "block";

}


// ===============================
// Tracking Message
// ===============================

function showTrackMessage(message) {

  const box = document.getElementById("trackResult");

  if (!box) {
    return;
  }

  box.style.display = "block";

  box.innerHTML =
    '<div class="track-error">' +
    escapeHTML(message) +
    "</div>";
}


// ===============================
// JSONP API
// ===============================

function api(params) {

  return new Promise(function (resolve, reject) {

    const callbackName =
      "alkhwarizmiCallback_" +
      Date.now() +
      "_" +
      Math.floor(Math.random() * 100000);

    const script = document.createElement("script");

    const query = new URLSearchParams(params);

    query.set("callback", callbackName);

    script.src = API + "?" + query.toString();

    let finished = false;

    function cleanup() {

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      try {
        delete window[callbackName];
      } catch (e) {
        window[callbackName] = undefined;
      }

    }

    window[callbackName] = function (data) {

      if (finished) {
        return;
      }

      finished = true;

      cleanup();

      resolve(data);

    };

    script.onerror = function () {

      if (finished) {
        return;
      }

      finished = true;

      cleanup();

      reject(
        new Error("تعذر الاتصال بخدمة التتبع.")
      );

    };

    document.body.appendChild(script);

    // Timeout
    setTimeout(function () {

      if (finished) {
        return;
      }

      finished = true;

      cleanup();

      reject(
        new Error("انتهت مهلة الاتصال بخدمة التتبع.")
      );

    }, 15000);

  });

}


// ===============================
// Track Shipment
// ===============================

async function trackShipment(code) {

  const resultBox =
    document.getElementById("trackResult");

  if (!resultBox) {
    return;
  }

  code = String(code || "")
    .trim()
    .toUpperCase();

  if (!code) {
    showTrackMessage("من فضلك أدخل رقم الشحنة.");
    return;
  }

  resultBox.style.display = "block";

  resultBox.innerHTML =
    '<div class="track-loading">' +
    "جاري البحث عن الشحنة..." +
    "</div>";

  try {

    const data = await api({
      action: "get",
      code: code
    });

    if (!data || data.ok !== true) {

      resultBox.innerHTML =
        '<div class="track-error">' +
        escapeHTML(
          data && data.message
            ? data.message
            : "رقم الشحنة غير موجود."
        ) +
        "</div>";

      return;
    }

    renderTrackingResult(data);

  } catch (error) {

    resultBox.innerHTML =
      '<div class="track-error">' +
      escapeHTML(
        error.message ||
        "حدث خطأ أثناء الاتصال بخدمة التتبع."
      ) +
      "</div>";

  }

}


// ===============================
// Render Tracking Result
// ===============================

function renderTrackingResult(data) {

  const resultBox =
    document.getElementById("trackResult");

  if (!resultBox) {
    return;
  }

  const status = String(data.status || "");

  let currentIndex =
    Number.isFinite(Number(data.statusIndex))
      ? Number(data.statusIndex)
      : STATUSES.indexOf(status);

  if (currentIndex < 0) {
    currentIndex = 0;
  }

  const updated =
    formatDate(data.updatedAt);

  let html = "";

  html += '<div class="tracking-card">';

  html +=
    '<div class="tracking-head">' +
    "<h3>بيانات الشحنة</h3>" +
    "</div>";

  html += '<div class="tracking-info">';

  html +=
    '<div class="tracking-item">' +
    "<span>رقم الشحنة</span>" +
    "<strong>" +
    escapeHTML(data.code || "") +
    "</strong>" +
    "</div>";

  if (data.clientName) {

    html +=
      '<div class="tracking-item">' +
      "<span>اسم العميل</span>" +
      "<strong>" +
      escapeHTML(data.clientName) +
      "</strong>" +
      "</div>";

  }

  if (data.carInfo) {

    html +=
      '<div class="tracking-item">' +
      "<span>السيارة</span>" +
      "<strong>" +
      escapeHTML(data.carInfo) +
      "</strong>" +
      "</div>";

  }

  if (data.chassis) {

    html +=
      '<div class="tracking-item">' +
      "<span>رقم الشاسيه</span>" +
      "<strong>" +
      escapeHTML(data.chassis) +
      "</strong>" +
      "</div>";

  }

  if (updated) {

    html +=
      '<div class="tracking-item">' +
      "<span>آخر تحديث</span>" +
      "<strong>" +
      escapeHTML(updated) +
      "</strong>" +
      "</div>";

  }

  html += "</div>";

  // الحالة الحالية
  html +=
    '<div class="current-status">' +
    "<span>الحالة الحالية</span>" +
    "<strong>" +
    escapeHTML(status) +
    "</strong>" +
    "</div>";

  // Timeline
  html += '<div class="tracking-timeline">';

  STATUSES.forEach(function (item, index) {

    let state = "";

    if (index < currentIndex) {
      state = "done";
    } else if (index === currentIndex) {
      state = "active";
    } else {
      state = "pending";
    }

    html +=
      '<div class="timeline-item ' +
      state +
      '">';

    html +=
      '<div class="timeline-dot"></div>';

    html +=
      '<div class="timeline-text">' +
      escapeHTML(item) +
      "</div>";

    html += "</div>";

  });

  html += "</div>";

  // Notes
  if (data.note) {

    html +=
      '<div class="tracking-note">' +
      "<strong>ملاحظات:</strong><br>" +
      escapeHTML(data.note) +
      "</div>";

  }

  html += "</div>";

  resultBox.innerHTML = html;

}


// ===============================
// Compatibility Function
// ===============================

function track(code) {
  return trackShipment(code);
}


// ===============================
// Format Date
// ===============================

function formatDate(value) {

  if (!value) {
    return "";
  }

  try {

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  } catch (e) {

    return String(value);

  }

}


// ===============================
// Escape HTML
// ===============================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
