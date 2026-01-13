#!/usr/bin/env tsx

/**
 * Skorlama Mantığı Test Scripti
 * 
 * Sistemin doğru çalıştığını test eder:
 * - Az yorumlu yerlerin skorları düşürülüyor mu?
 * - Çok yorumlu yerler öncelikli mi?
 * - Sıralama mantığı doğru mu?
 */

import { adjustScoreByReviewCount, calculateSortingScore } from '../lib/utils/score-adjustment'

interface TestCase {
  name: string
  score: number
  reviewCount: number
  rating?: number
  expectedBehavior: string
}

const testCases: TestCase[] = [
  {
    name: '3 yorumlu 5 yıldız (100 skor)',
    score: 100,
    reviewCount: 3,
    rating: 5,
    expectedBehavior: 'Skor düşürülmeli (~73)',
  },
  {
    name: '100 yorumlu 4.5 yıldız (90 skor)',
    score: 90,
    reviewCount: 100,
    rating: 4.5,
    expectedBehavior: 'Skor korunmalı (~90)',
  },
  {
    name: '10 yorumlu 4 yıldız (80 skor)',
    score: 80,
    reviewCount: 10,
    rating: 4,
    expectedBehavior: 'Skor hafif düşürülmeli (~75-80)',
  },
  {
    name: '50 yorumlu 4.8 yıldız (96 skor)',
    score: 96,
    reviewCount: 50,
    rating: 4.8,
    expectedBehavior: 'Skor korunmalı (~95-96)',
  },
  {
    name: '1 yorumlu 5 yıldız (100 skor)',
    score: 100,
    reviewCount: 1,
    rating: 5,
    expectedBehavior: 'Skor çok düşürülmeli (~55-60)',
  },
  {
    name: '200 yorumlu 4.2 yıldız (84 skor)',
    score: 84,
    reviewCount: 200,
    rating: 4.2,
    expectedBehavior: 'Skor korunmalı (~84)',
  },
]

function runTests() {
  console.log('🧪 SKORLAMA MANTIĞI TESTLERİ\n')
  console.log('=' .repeat(80))
  
  let passCount = 0
  let failCount = 0
  
  for (const testCase of testCases) {
    console.log(`\n📊 Test: ${testCase.name}`)
    console.log(`   Beklenen: ${testCase.expectedBehavior}`)
    
    // priorMean sabit 50 olmalı (rating'e göre değil), böylece az yorumlu yerlerin skorları düşer
    const adjustedScore = adjustScoreByReviewCount(
      testCase.score,
      testCase.reviewCount,
      {
        method: 'bayesian',
        priorMean: 50, // Sabit prior mean - rating'e göre değil!
        confidenceConstant: 10,
      }
    )
    
    const sortingScore = calculateSortingScore(
      testCase.score,
      testCase.reviewCount,
      testCase.rating
    )
    
    console.log(`   Orijinal Skor: ${testCase.score}`)
    console.log(`   Ayarlanmış Skor: ${adjustedScore}`)
    console.log(`   Sıralama Skoru: ${sortingScore}`)
    console.log(`   Yorum Sayısı: ${testCase.reviewCount}`)
    
    // Mantık kontrolü
    let passed = true
    let reason = ''
    
    if (testCase.reviewCount < 10) {
      // Az yorumlu yerlerin skoru düşürülmeli
      if (adjustedScore >= testCase.score) {
        passed = false
        reason = 'Az yorumlu yerlerin skoru düşürülmedi!'
      }
    } else if (testCase.reviewCount >= 50) {
      // Çok yorumlu yerlerin skoru korunmalı
      if (Math.abs(adjustedScore - testCase.score) > 5) {
        passed = false
        reason = 'Çok yorumlu yerlerin skoru çok düşürüldü!'
      }
    }
    
    if (passed) {
      console.log(`   ✅ PASS`)
      passCount++
    } else {
      console.log(`   ❌ FAIL: ${reason}`)
      failCount++
    }
  }
  
  console.log('\n' + '='.repeat(80))
  console.log(`\n📈 SONUÇ:`)
  console.log(`   ✅ Başarılı: ${passCount}`)
  console.log(`   ❌ Başarısız: ${failCount}`)
  console.log(`   📊 Toplam: ${testCases.length}`)
  
  // Karşılaştırma testi
  console.log('\n' + '='.repeat(80))
  console.log('🔄 KARŞILAŞTIRMA TESTİ\n')
  
  const place1 = {
    name: '3 Yorumlu Yer',
    score: 100,
    reviewCount: 3,
    rating: 5,
  }
  
  const place2 = {
    name: '100 Yorumlu Yer',
    score: 90,
    reviewCount: 100,
    rating: 4.5,
  }
  
  const place1Adjusted = adjustScoreByReviewCount(
    place1.score,
    place1.reviewCount,
    {
      method: 'bayesian',
      priorMean: 50, // Sabit prior mean - rating'e göre değil!
      confidenceConstant: 10,
    }
  )
  
  const place2Adjusted = adjustScoreByReviewCount(
    place2.score,
    place2.reviewCount,
    {
      method: 'bayesian',
      priorMean: 50, // Sabit prior mean - rating'e göre değil!
      confidenceConstant: 10,
    }
  )
  
  const place1Sorting = calculateSortingScore(
    place1.score,
    place1.reviewCount,
    place1.rating
  )
  
  const place2Sorting = calculateSortingScore(
    place2.score,
    place2.reviewCount,
    place2.rating
  )
  
  console.log(`📊 ${place1.name}:`)
  console.log(`   Orijinal: ${place1.score}, Ayarlanmış: ${place1Adjusted}, Sıralama: ${place1Sorting}`)
  console.log(`📊 ${place2.name}:`)
  console.log(`   Orijinal: ${place2.score}, Ayarlanmış: ${place2Adjusted}, Sıralama: ${place2Sorting}`)
  
  if (place2Sorting > place1Sorting) {
    console.log(`\n✅ DOĞRU: ${place2.name} öncelikli (${place2Sorting} > ${place1Sorting})`)
  } else {
    console.log(`\n❌ YANLIŞ: ${place1.name} öncelikli olmamalı! (${place1Sorting} > ${place2Sorting})`)
  }
  
  console.log('\n' + '='.repeat(80))
}

runTests()

