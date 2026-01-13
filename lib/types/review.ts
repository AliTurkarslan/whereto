export interface ReviewCategory {
  name: string
  score: number // 0-100
  positiveRatio: number // 0-1 (pozitif yorum oranı)
  positiveExamples?: string[] // 1-2 pozitif örnek yorum
  negativeExamples?: string[] // 1-2 negatif örnek yorum
}

