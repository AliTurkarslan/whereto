/**
 * API Kullanım Takibi ve Maliyet Hesaplama
 * 
 * Google API kullanımını izler ve maliyet tahmini yapar
 */

interface ApiUsage {
  placesTextSearch: number
  placesNearbySearch: number
  placesDetails: number
  geocoding: number
  directions: number
  streetView: number
  timeZone: number
}

interface CostBreakdown {
  api: string
  requests: number
  cost: number
  freeTierLimit: number
  remaining: number
}

const API_PRICING = {
  placesTextSearch: 0.032, // $32 per 1,000
  placesNearbySearch: 0.032, // $32 per 1,000
  placesDetails: 0.017, // $17 per 1,000
  geocoding: 0.005, // $5 per 1,000
  directions: 0.005, // $5 per 1,000
  streetView: 0.007, // $7 per 1,000
  timeZone: 0.005, // $5 per 1,000
}

const FREE_TIER_LIMITS = {
  placesTextSearch: 6250, // $200 / $0.032
  placesNearbySearch: 6250,
  placesDetails: 11765,
  geocoding: 40000,
  directions: 40000,
  streetView: 28571,
  timeZone: 40000,
}

export class CostTracker {
  private usage: ApiUsage = {
    placesTextSearch: 0,
    placesNearbySearch: 0,
    placesDetails: 0,
    geocoding: 0,
    directions: 0,
    streetView: 0,
    timeZone: 0,
  }

  /**
   * API kullanımını kaydet
   */
  track(api: keyof ApiUsage, count: number = 1) {
    this.usage[api] += count
  }

  /**
   * Toplam maliyeti hesapla
   */
  getTotalCost(): number {
    let total = 0
    for (const [api, requests] of Object.entries(this.usage)) {
      const price = API_PRICING[api as keyof ApiUsage]
      total += (requests * price) / 1000
    }
    return total
  }

  /**
   * Detaylı maliyet dökümü
   */
  getCostBreakdown(): CostBreakdown[] {
    return Object.entries(this.usage).map(([api, requests]) => {
      const price = API_PRICING[api as keyof ApiUsage]
      const cost = (requests * price) / 1000
      const limit = FREE_TIER_LIMITS[api as keyof ApiUsage]
      const remaining = Math.max(0, limit - requests)

      return {
        api,
        requests,
        cost,
        freeTierLimit: limit,
        remaining,
      }
    })
  }

  /**
   * Free tier limitine ne kadar kaldı?
   */
  getRemainingFreeTier(): number {
    const totalCost = this.getTotalCost()
    return Math.max(0, 200 - totalCost) // $200 free tier
  }

  /**
   * Kullanım özeti
   */
  getSummary(): string {
    const totalCost = this.getTotalCost()
    const remaining = this.getRemainingFreeTier()
    const percentage = ((totalCost / 200) * 100).toFixed(1)

    return `
📊 API Kullanım Özeti
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Toplam Maliyet: $${totalCost.toFixed(2)}
🎁 Free Tier Kalan: $${remaining.toFixed(2)}
📈 Kullanım: %${percentage}

Detaylar:
${this.getCostBreakdown()
  .map((item) => `  ${item.api}: ${item.requests} request = $${item.cost.toFixed(2)} (Kalan: ${item.remaining})`)
  .join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim()
  }

  /**
   * Kullanımı sıfırla (aylık reset için)
   */
  reset() {
    this.usage = {
      placesTextSearch: 0,
      placesNearbySearch: 0,
      placesDetails: 0,
      geocoding: 0,
      directions: 0,
      streetView: 0,
      timeZone: 0,
    }
  }

  /**
   * Mevcut kullanımı al
   */
  getUsage(): ApiUsage {
    return { ...this.usage }
  }
}

// Singleton instance
export const costTracker = new CostTracker()


