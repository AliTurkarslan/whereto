# 🎯 KULLANICI İHTİYAÇ BAZLI KATEGORİ SİSTEMİ

## 📋 SİSTEMİN AMACI

Kullanıcı:
- "Yemek için dışarı çıkacağım"
- "Kahve içmek için dışarı çıkacağım"
- "Eğlence için dışarı çıkacağım"

**İhtiyacı:** Doğru yere gitmek, pişman olmamak
**Sistem:** Yorumları analiz edip en uygun yeri seçer
**Odak:** Google Maps kategorisi bulmak DEĞİL, doğru yere karar vermek

## ❌ ŞU ANKİ SORUN

1. **Teknik Kategoriler:** restaurant, cafe, bar, vb. (Google Maps API kategorileri)
2. **Kullanıcı Dostu Değil:** Kullanıcı "yemek" diyor, sistem "restaurant" arıyor
3. **Karmaşık:** Kategori seçimi teknik terimlerle dolu
4. **Odak Yanlış:** Kategori bulmak odaklı, ihtiyaç odaklı değil

## ✅ ÇÖZÜM: İHTİYAÇ BAZLI KATEGORİLER

### Kullanıcı İhtiyaç Kategorileri

1. **🍽️ Yemek** → restaurant, cafe, bar, bakery, meal_takeaway, meal_delivery
2. **☕ Kahve** → cafe, bakery
3. **🍺 İçecek** → bar, cafe
4. **🎬 Eğlence** → movie_theater, night_club, amusement_center, park, tourist_attraction
5. **🛍️ Alışveriş** → shopping_mall, clothing_store, shoe_store, supermarket
6. **💇 Güzellik & Bakım** → hair_salon, beauty_salon, spa, gym
7. **🏨 Konaklama** → hotel, lodging, resort
8. **🎨 Kültür & Sanat** → museum, art_gallery, tourist_attraction
9. **🏥 Sağlık** → hospital, pharmacy, dentist
10. **🚗 Ulaşım** → gas_station, parking, transit_station

### Mapping Mantığı

```typescript
USER_NEEDS = {
  yemek: {
    displayName: { tr: 'Yemek', en: 'Food' },
    googleMapsTypes: ['restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway', 'meal_delivery'],
    icon: 'UtensilsCrossed',
    color: 'bg-orange-500'
  },
  kahve: {
    displayName: { tr: 'Kahve', en: 'Coffee' },
    googleMapsTypes: ['cafe', 'bakery'],
    icon: 'Coffee',
    color: 'bg-amber-600'
  },
  // ...
}
```

## 🔧 YAPILACAK DEĞİŞİKLİKLER

### 1. Yeni Kategori Sistemi Oluştur

**Dosya:** `lib/config/user-needs-categories.ts` (YENİ)

```typescript
export interface UserNeedCategory {
  id: string // yemek, kahve, eglence, vb.
  displayName: { tr: string; en: string }
  icon: string
  color: string
  googleMapsTypes: string[] // Bu ihtiyaca karşılık gelen Google Maps kategorileri
  description?: { tr: string; en: string } // Kullanıcıya açıklama
}

export const USER_NEED_CATEGORIES: Record<string, UserNeedCategory> = {
  yemek: {
    id: 'yemek',
    displayName: { tr: 'Yemek', en: 'Food' },
    icon: 'UtensilsCrossed',
    color: 'bg-orange-500',
    googleMapsTypes: ['restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway', 'meal_delivery'],
    description: { tr: 'Restoran, kafe, bar veya yemek servisi', en: 'Restaurant, cafe, bar or food service' }
  },
  kahve: {
    id: 'kahve',
    displayName: { tr: 'Kahve', en: 'Coffee' },
    icon: 'Coffee',
    color: 'bg-amber-600',
    googleMapsTypes: ['cafe', 'bakery'],
    description: { tr: 'Kahve içmek için mekanlar', en: 'Places for coffee' }
  },
  // ...
}
```

### 2. CategoryStep'i Güncelle

**Dosya:** `components/CategoryStep.tsx`

- Google Maps kategorileri yerine kullanıcı ihtiyaç kategorilerini göster
- Daha anlaşılır, kullanıcı dostu
- "Yemek", "Kahve", "Eğlence" gibi günlük dilde kategoriler

### 3. API Endpoint'i Güncelle

**Dosya:** `app/api/recommend/route.ts`

- Kullanıcı ihtiyaç kategorisini al
- Google Maps kategorilerine map et
- Database'de arama yap

### 4. Database Sorgularını Güncelle

**Dosya:** `lib/db/index.ts`

- Kullanıcı ihtiyaç kategorisini Google Maps kategorilerine çevir
- Tüm ilgili kategorileri ara
- Sonuçları döndür

## 🎯 KULLANICI DENEYİMİ

### Önce:
1. Kullanıcı: "Restoranlar" seçer (teknik terim)
2. Sistem: restaurant, cafe, bar, vb. arar
3. Sonuç: Karışık, teknik

### Sonra:
1. Kullanıcı: "Yemek" seçer (günlük dil)
2. Sistem: restaurant, cafe, bar, bakery, meal_takeaway, meal_delivery arar
3. Sonuç: Kullanıcı ihtiyacına uygun, anlaşılır

## 📋 UYGULAMA PLANI

1. ✅ Kullanıcı ihtiyaç kategorileri tanımla
2. ✅ CategoryStep'i güncelle
3. ✅ API endpoint'i güncelle
4. ✅ Database sorgularını güncelle
5. ✅ Test et

## 🎨 UI/UX İYİLEŞTİRMELERİ

- Kategoriler daha büyük, daha görsel
- Açıklayıcı metinler
- İkonlar daha belirgin
- Renkler daha canlı



