# موقع الخوارزمي — النسخة الجديدة

## ما تم تحسينه
- قسم أوراق مطلوبة مفصل.
- صفحات منفصلة للخدمات.
- واتساب وفيسبوك والعنوان.
- نظام تتبع من 15 مرحلة.
- لوحة تحكم admin.html.
- ربط مجاني اختياري مع Google Sheets عبر Google Apps Script.

## مهم
GitHub Pages يستضيف ملفات ثابتة، لذلك لا يمكن أن تكون لوحة التحكم قاعدة بيانات حقيقية وحدها. استخدم Code.gs مع Google Sheets:
1. أنشئ Google Sheet.
2. Extensions > Apps Script.
3. الصق Code.gs.
4. غيّر CHANGE_THIS_KEY إلى مفتاح سري طويل.
5. شغّل setup مرة واحدة.
6. Deploy > New deployment > Web app.
7. Execute as: Me.
8. Who has access: Anyone.
9. انسخ Web App URL.
10. افتح admin.html وضع الرابط والمفتاح.
