# 📄 DocuScan Pro - AI Document Scanner & Auto-Crop

স্মার্ট ডকুমেন্ট স্ক্যানার ও ক্যামেরা অ্যাপ্লিকেশন—যা স্বয়ংক্রিয়ভাবে বিছানা বা টেবিলের ব্যাকগ্রাউন্ড বাদ দিয়ে (Auto-Crop) শুধু খাতা, বই বা রসিদের অংশ সংরক্ষণ করে, পার্সপেক্টিভ সোজা করে এবং ক্যামস্ক্যানার স্টাইলে কালার এনহ্যান্স করে মাল্টি-পেজ PDF তৈরি করে।

---

## 📱 Android APK Configuration

| ফিল্ড | মান (Value) |
| :--- | :--- |
| **অ্যাপের নাম (App Name)** | `DocuScan Pro` |
| **প্যাকেজ নাম (Package Name / Application ID)** | `com.docuscan.scanner` |
| **ভার্সন কোড (Version Code)** | `1` |
| **ভার্সন নেম (Version Name)** | `1.0.0` |
| **মিনিমাম অ্যান্ড্রয়েড SDK (Min SDK)** | Android 7.0 (API 24+) |
| **টার্গেট অ্যান্ড্রয়েড SDK (Target SDK)** | Android 14 / 15 (API 34/36) |
| **অনুমতি (Permissions)** | ক্যামেরা (`CAMERA`), ফ্ল্যাশলাইট (`FLASHLIGHT`), গ্যালারি ফাইল (`READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE`) |

---

## 🚀 GitHub Actions দিয়ে যেভাবে APK বিল্ড করবেন (How to Build APK)

এই প্রজেক্টে GitHub Actions এর কমপ্লিট অটোমেটেড বিল্ড ওয়ার্কফ্লো (`.github/workflows/build-apk.yml`) কনফিগার করা আছে।

### ধাপসমূহ:

1. **GitHub-এ কোড পুশ করুন:**
   আপনার GitHub রিপোজিটরিতে এই কোড পুশ করুন (`main` অথবা `master` ব্রাঞ্চে)।

2. **Actions ট্যাবে যান:**
   GitHub রিপোজিটরির উপরের মেন্যু থেকে **Actions** ট্যাবে ক্লিক করুন।

3. **ওয়ার্কফ্লো রান করুন:**
   - বাম পাশের তালিকা থেকে **"Build Android APK (DocuScan Pro)"** সিলেক্ট করুন।
   - ডান পাশে **"Run workflow"** ড্রপডাউন বাটনে ক্লিক করে সবুজ রঙের **"Run workflow"** চাপুন। (অথবা কোড পুশ করলেই এটি স্বয়ংক্রিয়ভাবে বিল্ড শুরু হবে)।

4. **APK ডাউনলোড করুন:**
   - বিল্ড সম্পন্ন হলে (সবুজ টিক চিহ্ন আসলে) রানটিতে ক্লিক করুন।
   - পেজের নিচের দিকে **Artifacts** সেকশনে যান।
   - **`DocuScan-Pro-v1.0.0-Debug-APK`** ফাইলে ক্লিক করে ডাউনলোড করুন।
   - জিপ ফাইলটি আনজিপ করলেই পাবেন ইনস্টলযোগ্য **`app-debug.apk`**।

5. **মোবাইলে ইনস্টল করুন:**
   - `app-debug.apk` ফাইলটি আপনার অ্যান্ড্রয়েড ফোনে নিন।
   - ফাইলে চাপ দিয়ে ইনস্টল করুন। (যদি "Install unknown apps" চাই, অনুমোদন দিন)।

---

## 🔄 ভবিষ্যতে ভার্সন পরিবর্তন করতে চাইলে (How to Update Version)

ভবিষ্যতে যদি নতুন ভার্সন (যেমন Version 2, 1.1.0) রিলিজ করতে চান:

১. `android/app/build.gradle` ফাইলে যান:
```gradle
defaultConfig {
    applicationId "com.docuscan.scanner"
    versionCode 2       // সংখ্যা ১ বাড়িয়ে ২ দিন
    versionName "1.1.0" // নতুন ভার্সন টেক্সট লিখুন
}
```
২. গিটহাবে পুশ করলেই নতুন ভার্সনের APK তৈরি হয়ে যাবে!
