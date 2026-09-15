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

/* =========================
   تشغيل الموقع
========================= */
document.addEventListener("DOMContentLoaded", () => {

  /* السنة */
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }


  /* =========================
     القائمة الرئيسية - الموبايل
  ========================= */
  const menuBtn = document.getElementById("menuBtn");
  const nav = document.getElementById("mainNav");

  if (menuBtn && nav) {

    menuBtn.setAttribute("aria-expanded", "false");

    menuBtn.addEventListener("click", (event) => {

      event.stopPropagation();

      const open = nav.classList.toggle("open");

      menuBtn.setAttribute(
        "aria-expanded",
        String(open)
      );

      menuBtn.setAttribute(
        "aria-label",
        open ? "إغلاق القائمة" : "فتح القائمة"
      );

    });


    /* إغلاق القائمة بعد اختيار رابط */
    nav.querySelectorAll("a").forEach((link) => {

      link.addEventListener("click", () => {

        nav.classList.remove("open");

        menuBtn.setAttribute(
          "aria-expanded",
          "false"
        );

        menuBtn.setAttribute(
          "aria-label",
          "فتح القائمة"
        );

      });

    });


    /* إغلاق القائمة عند الضغط خارجها */
    document.addEventListener("click", (event) => {

      if (
        nav.classList.contains("open") &&
        !nav.contains(event.target) &&
        event.target !== menuBtn
      ) {

        nav.classList.remove("open");

        menuBtn.setAttribute(
          "aria-expanded",
          "false"
        );

        menuBtn.setAttribute(
          "aria-label",
          "فتح القائمة"
        );

      }

    });

  }


  /* =========================
     نموذج طلب الخدمة
  ========================= */
  const leadForm = document.getElementById("leadForm");

  if (leadForm) {

    leadForm.addEventListener("submit", (event) => {

      event.preventDefault();

      const data = {
        name: getValue("leadName"),
        phone: getValue("leadPhone"),
        car: getValue("leadCar"),
        model: getValue("leadModel"),
        year: getValue("leadYear"),
        country: getValue("leadCountry"),
        service: getValue("leadService"),
        note: getValue("leadNote")
      };


      /* التحقق من البيانات الأساسية */
      if (!data.name || !data.phone) {

        showLeadMessage(
          "من فضلك اكتب الاسم ورقم الهاتف."
        );

        return;

      }


      /* رسالة واتساب */
      const message = [
        "طلب جديد من موقع شركة الخوارزمي",
        "",
        `الاسم: ${data.name}`,
        `الهاتف / واتساب: ${data.phone}`,
        `السيارة: ${data.car || "غير محدد"}`,
        `الموديل: ${data.model || "غير محدد"}`,
        `سنة الصنع: ${data.year || "غير محددة"}`,
        `بلد السيارة: ${data.country || "غير محدد"}`,
        `الخدمة المطلوبة: ${data.service || "غير محددة"}`,
        `ملاحظات: ${data.note || "لا يوجد"}`
      ].join("\n");


      const whatsappURL =
        "https://wa.me/201003299254?text=" +
        encodeURIComponent(message);


      window.open(
        whatsappURL,
        "_blank",
        "noopener,noreferrer"
      );


      showLeadMessage(
        "تم تجهيز رسالة واتساب للتواصل السريع."
      );

    });

  }


  /* =========================
     نموذج تتبع الشحنة
  ========================= */
  const trackForm =
    document.getElementById("trackForm");

  if (trackForm) {

    trackForm.addEventListener("submit", (event) => {

      event.preventDefault();

      trackShipment(
        getValue("trackCode")
      );

    });

  }


  /* كتابة رقم الشحنة */
  const trackCode =
    document.getElementById("trackCode");

  if (trackCode) {

    trackCode.addEventListener("input", () => {

      trackCode.value =
        trackCode.value.toUpperCase();

    });

  }

});


/* =========================
   الحصول على قيمة عنصر
========================= */
function getValue(id) {

  const element =
    document.getElementById(id);

  if (!element) {
    return "";
  }

  return String(
    element.value || ""
  ).trim();

}


/* =========================
   رسالة نموذج التواصل
========================= */
function showLeadMessage(message) {

  const element =
    document.getElementById("leadMsg");

  if (element) {
    element.textContent = message;
  }

}


/* =========================
   الاتصال بـ Google Apps Script
   باستخدام JSONP
========================= */
function api(params) {

  return new Promise((resolve, reject) => {

    const callbackName =
      "khwarizmi_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .substring(2);


    const script =
      document.createElement("script");


    const url =
      new URL(API);


    Object.entries(params).forEach(
      ([key, value]) => {

        url.searchParams.set(
          key,
          value == null ? "" : String(value)
        );

      }
    );


    url.searchParams.set(
      "callback",
      callbackName
    );


    let finished = false;


    const timeout =
      setTimeout(() => {

        if (finished) return;

        finished = true;

        cleanup();

        reject(
          new Error("Request timeout")
        );

      }, 15000);


    window[callbackName] =
      (data) => {

        if (finished) return;

        finished = true;

        clearTimeout(timeout);

        cleanup();

        resolve(data);

      };


    script.onerror = () => {

      if (finished) return;

      finished = true;

      clearTimeout(timeout);

      cleanup();

      reject(
        new Error("API connection error")
      );

    };


    function cleanup() {

      try {

        delete window[callbackName];

      } catch (error) {

        window[callbackName] = undefined;

      }


      if (script.parentNode) {

        script.parentNode.removeChild(
          script
        );

      }

    }


    script.src =
      url.toString();


    document.body.appendChild(
      script
    );

  });

}


/* =========================
   تتبع الشحنة
========================= */
async function trackShipment(code) {

  const result =
    document.getElementById("trackResult");


  if (!result) {
    return;
  }


  code =
    String(code || "")
      .trim()
      .toUpperCase();


  if (!code) {

    result.innerHTML =
      '<div class="notice">اكتب رقم الشحنة أولًا.</div>';

    return;

  }


  result.innerHTML =
    '<div class="notice">جاري البحث عن الشحنة...</div>';


  try {

    const data =
      await api({
        action: "get",
        code: code
      });


    if (!data || !data.ok) {

      result.innerHTML =
        '<div class="notice">لم يتم العثور على الشحنة بهذا الرقم.</div>';

      return;

    }


    const currentIndex =
      Number(
        data.statusIndex || 0
      );


    let html = `

      <div class="card tracking-card">

        <h3>
          الشحنة:
          ${escapeHTML(data.code)}
        </h3>

        <p>

          <b>العميل:</b>
          ${escapeHTML(
            data.clientName || "—"
          )}

          <br>

          <b>السيارة:</b>
          ${escapeHTML(
            data.carInfo || "—"
          )}

          <br>

          <b>آخر تحديث:</b>
          ${escapeHTML(
            formatDate(data.updatedAt) || "—"
          )}

        </p>

        <div class="tracking-steps">

    `;


    STATUSES.forEach(
      (status, index) => {

        const completed =
          index <= currentIndex;


        html += `

          <div class="step ${completed ? "done" : ""}">

            <span class="dot"></span>

            <strong>
              ${escapeHTML(
                `${index + 1}. ${status}`
              )}
            </strong>

          </div>

        `;

      }
    );


    html += `

        </div>

    `;


    /* الملاحظات */
    if (data.note) {

      html += `

        <div class="notice tracking-note">

          ${escapeHTML(
            data.note
          )}

        </div>

      `;

    }


    html += "</div>";


    result.innerHTML =
      html;


  } catch (error) {

    console.error(
      "Tracking error:",
      error
    );


    result.innerHTML = `

      <div class="notice">

        تعذر الاتصال بنظام المتابعة.
        حاول مرة أخرى بعد قليل.

      </div>

    `;

  }

}


/* =========================
   توافق مع الكود القديم
========================= */
function track(code) {

  return trackShipment(code);

}


/* =========================
   تنسيق التاريخ
========================= */
function formatDate(value) {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return String(value);

  }


  return date.toLocaleString(
    "ar-EG",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


/* =========================
   حماية عرض البيانات
========================= */
function escapeHTML(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      (char) => {

        const entities = {

          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"

        };

        return entities[char];

      }
    );

        }
