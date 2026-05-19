# إعداد واتساب بزنس (مجاني)

## الطريقة: WhatsApp Cloud API (Meta)

### 1. إنشاء تطبيق في Meta
- اذهب إلى https://developers.facebook.com
- اضغط **My Apps** ← **Create App**
- اختر **Business** ← **Next**
- املأ البيانات ← **Create App**

### 2. إضافة منتج WhatsApp
- في لوحة التطبيق، اذهب إلى **Add Product**
- اختر **WhatsApp** ← **Set Up**

### 3. الحصول على المفاتيح
- في صفحة WhatsApp → **Getting Started**
- راح تلقي:
  - **Phone number ID** ← انسخه
  - **Temporary access token** ← انسخه
- أضفهم في `.env`:

```
WHATSAPP_TOKEN=EAATgxxx...
WHATSAPP_PHONE_NUMBER_ID=123456789
```

> **ملاحظة**: الـ temporary token يعيش 24 ساعة فقط. عشان تخليه دائم:
> - اذهب إلى **Meta Business Suite** → **Business Settings** → **Users** → **System Users**
> - أنشئ System User مع `whatsapp_business_messaging` و `whatsapp_business_management` permissions
> - سوي **Generate Token** واختار التطبيق المناسب — يصير permanent

### 4. إنشاء Template (قالب الرسالة)
- نفس صفحة WhatsApp → **Template Management** → **Create Template**
- Category: **Utility**
- Name: `order_confirmation`  
- Language: **Arabic**
- Body: `👕 طلب تيشيرت {{1}}\nرقم الطلب: {{2}}\n📌 لتأكيد الطلب، اضغط على الرابط:\n{{3}}`
- Footer: `O ONE`
- Submit ← راح ياخذ شوي عشان يتapproved

### 5. جرب
- سو طلب من basmah (http://localhost:5173)
- راح توصلك رسالة واتساب تلقائياً
