const DEFAULT_API = "https://script.google.com/macros/s/AKfycbwRXtdjZYyrKrJC8DBiRvL7AoXNYKVeMuTlygWP0tFPGIG3vZqh7/exec";

const statuses = [
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


/* =========================================================
   تشغيل الموقع
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  /* السنة الحالية */
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }


  /* حالات الشحن في لوحة الإدارة */
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


  /* رابط Google Apps Script */
  const apiUrl = document.getElementById("apiUrl");

  if (apiUrl) {
    apiUrl.value = DEFAULT_API;
  }


  /* زر إعدادات نظام المتابعة */
  const saveConfig = document.getElementById("saveConfig");

  if (saveConfig) {

    saveConfig.onclick = function () {

      localStorage.setItem("kh_api", DEFAULT_API);

      alert("تم حفظ إعدادات نظام المتابعة");

    };

  }


  /* =======================================================
     قائمة الموبايل
     ======================================================= */

  const menuBtn = document.getElementById("menuBtn");
  const mainNav = document.getElementById("mainNav");

  if (menuBtn && mainNav) {

    menuBtn.addEventListener("click", function () {

      mainNav.classList.toggle("open");

      menuBtn.classList.toggle("active");

    });


    /* إغلاق القائمة عند الضغط على أي رابط */

    mainNav.querySelectorAll("a").forEach(function (link) {

      link.addEventListener("click", function () {

        mainNav.classList.remove("open");

        menuBtn.classList.remove("active");

      });

    });

  }


  /* =======================================================
     نموذج تتبع الشحنة
     ======================================================= */

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


  /* =======================================================
     زر حفظ الشحنة من لوحة الإدارة
     ======================================================= */

  const saveCarButton = document.getElementById("saveCar");

  if (saveCarButton) {

    saveCarButton.onclick = saveCar;

  }


  /* تشغيل السلايدر */

  initSlider();


  /* تشغيل نموذج طلب الخدمة */

  initLeadForm();

});


/* =========================================================
   الاتصال بـ Google Apps Script باستخدام JSONP
   ========================================================= */

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

      reject(
        new Error("تعذر الاتصال بـ Google Apps Script")
      );

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


/* =========================================================
   عرض نتيجة تتبع الشحنة
   ========================================================= */

function render(data, target) {

  if (!data || !data.ok) {

    target.innerHTML =
      '<div class="notice">' +
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
            ${index + 1}. ${escapeHtml(status)}
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


/* =========================================================
   البحث عن الشحنة
   ========================================================= */

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


/* =========================================================
   حفظ / تحديث الشحنة من لوحة الإدارة
   ========================================================= */

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


  const adminKeyElement =
    document.getElementById("adminKey");


  const adminKeyValue =
    adminKeyElement
      ? adminKeyElement.value.trim()
      : "";


  const code =
    codeElement
      ? codeElement.value.trim()
      : "";


  const clientName =
    clientElement
      ? clientElement.value.trim()
      : "";


  const carInfo =
    carElement
      ? carElement.value.trim()
      : "";


  const statusIndex =
    statusElement
      ? statusElement.value
      : "0";


  const note =
    noteElement
      ? noteElement.value.trim()
      : "";


  const phone =
    phoneElement
      ? phoneElement.value.trim()
      : "";


  const chassis =
    chassisElement
      ? chassisElement.value.trim()
      : "";


  if (!adminKeyValue) {

    message.innerHTML =
      '<div class="notice">اكتب مفتاح الإدارة.</div>';

    return;

  }


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

      key: adminKeyValue,

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
      'تعذر حفظ الشحنة. تأكد من الاتصال بالنظام.' +
      '</div>';

  }

}


/* =========================================================
   السلايدر الرئيسي
   ========================================================= */

function initSlider() {

  const slides =
    document.querySelectorAll(".slide");


  if (!slides.length) return;


  const dots =
    document.querySelectorAll(".dot");


  let current = 0;


  function showSlide(index) {

    current =
      (index + slides.length) % slides.length;


    slides.forEach(function (slide, i) {

      slide.classList.toggle(
        "active",
        i === current
      );

    });


    dots.forEach(function (dot, i) {

      dot.classList.toggle(
        "active",
        i === current
      );

    });

  }


  showSlide(0);


  /* تشغيل تلقائي */

  let timer = setInterval(function () {

    showSlide(current + 1);

  }, 5000);


  /* السهم السابق */

  const prev =
    document.getElementById("prevSlide");


  if (prev) {

    prev.addEventListener("click", function () {

      showSlide(current - 1);

      clearInterval(timer);

      timer = setInterval(function () {

        showSlide(current + 1);

      }, 5000);

    });

  }


  /* السهم التالي */

  const next =
    document.getElementById("nextSlide");


  if (next) {

    next.addEventListener("click", function () {

      showSlide(current + 1);

      clearInterval(timer);

      timer = setInterval(function () {

        showSlide(current + 1);

      }, 5000);

    });

  }


  /* نقاط السلايدر */

  dots.forEach(function (dot, index) {

    dot.addEventListener("click", function () {

      showSlide(index);

      clearInterval(timer);

      timer = setInterval(function () {

        showSlide(current + 1);

      }, 5000);

    });

  });

}


/* =========================================================
   نموذج ابدأ إجراءات سيارتك
   ========================================================= */

function initLeadForm() {

  const form =
    document.getElementById("leadForm");


  if (!form) return;


  form.addEventListener("submit", function (event) {

    event.preventDefault();


    const name =
      getValue("leadName");


    const phone =
      getValue("leadPhone");


    const car =
      getValue("leadCar");


    const model =
      getValue("leadModel");


    const year =
      getValue("leadYear");


    const country =
      getValue("leadCountry");


    const service =
      getValue("leadService");


    /* يدعم الاسمين */
    const notes =
      getValue("leadNote") ||
      getValue("leadNotes");


    if (!name || !phone || !car) {

      alert(
        "من فضلك اكتب الاسم ورقم الهاتف ونوع السيارة."
      );

      return;

    }


    const message =
`طلب جديد من موقع شركة الخوارزمي للتخليص الجمركي

الاسم: ${name}
رقم الهاتف / واتساب: ${phone}
نوع السيارة: ${car}
الموديل: ${model}
سنة الصنع: ${year}
بلد السيارة: ${country}
الخدمة المطلوبة: ${service}
ملاحظات: ${notes}`;


    const whatsappNumber =
      "201003299254";


    const whatsappUrl =
      "https://wa.me/" +
      whatsappNumber +
      "?text=" +
      encodeURIComponent(message);


    window.open(
      whatsappUrl,
      "_blank"
    );

  });

}


/* =========================================================
   الحصول على قيمة عنصر
   ========================================================= */

function getValue(id) {

  const element =
    document.getElementById(id);


  return element
    ? element.value.trim()
    : "";

}


/* =========================================================
   حماية عرض البيانات
   ========================================================= */

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

  }
