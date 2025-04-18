import { Injectable, Logger } from '@nestjs/common';
import { CoinGeckoService } from '../data-fetcher/coingecko.service';
import { BinanceService } from '../data-fetcher/binance.service';
import { IndexRegistryService } from '../blockchain/index-registry.service';
import { compositions, rebalances } from '../../db/schema';
import { DbService } from 'src/db/db.service';

@Injectable()
export class Top100Service {
  private readonly logger = new Logger(Top100Service.name);
  private readonly fallbackStablecoins = ['usdt', 'usdc', 'dai', 'busd'];
  private readonly fallbackWrappedTokens = ['wbtc', 'weth'];

  constructor(
    private coinGeckoService: CoinGeckoService,
    private binanceService: BinanceService,
    private indexRegistryService: IndexRegistryService,
    private dbService: DbService,
  ) {}

  async rebalanceTop100(indexId: number): Promise<void> {
    try {
      // Fetch market cap and Binance listings
      const marketCaps = await this.coinGeckoService.getMarketCap();
      const binanceTokens = new Set(await this.binanceService.getListedTokens());

      // Filter top 100, exclude stablecoins and wrapped tokens
      const eligibleTokens: any[] = [];
      for (const coin of marketCaps) {
        if (eligibleTokens.length >= 100) break;
        if (!binanceTokens.has(coin.symbol.toUpperCase())) continue;

        const categories = await this.coinGeckoService.getCategories(coin.id);
        const isStablecoin = categories.includes('Stablecoin');
        const isWrappedToken = categories.some((c) => c.includes('Wrapped'));

        if (!isStablecoin && !isWrappedToken) {
          eligibleTokens.push(coin);
        } else if (isStablecoin && !this.fallbackStablecoins.includes(coin.id)) {
          this.logger.warn(`Stablecoin ${coin.id} not in fallback list, consider updating`);
        } else if (isWrappedToken && !this.fallbackWrappedTokens.includes(coin.id)) {
          this.logger.warn(`Wrapped token ${coin.id} not in fallback list, consider updating`);
        }
      }

      if (eligibleTokens.length < 100) {
        this.logger.warn(`Only ${eligibleTokens.length} eligible tokens found for Top 100 index`);
      }

      // Equal weights (1% each, 100 basis points = 1%)
      const weights = eligibleTokens.map(() => 100);
      const tokenAddresses = eligibleTokens.map((coin) => this.mapCoinGeckoToToken(coin.id));
      const weightsForContract = tokenAddresses.map((addr, i) => [addr, weights[i]] as [string, number]);

      // Compute ETF price (sum of token prices * weights)
      const prices = await Promise.all(
        eligibleTokens.map((coin) => this.coinGeckoService.getLivePrice(coin.id)),
      );
      const etfPrice = prices.reduce((sum, price, i) => sum + price * (weights[i] / 10000), 0); // Weights in basis points

      // Store composition
      await this.dbService.getDb().insert(compositions).values(
        tokenAddresses.map((addr, i) => ({
          indexId: indexId.toString(),
          tokenAddress: addr,
          weight: (weights[i] / 100).toString(),
        })),
      );

      // Store rebalance
      await this.dbService.getDb().insert(rebalances).values({
        indexId: indexId.toString(),
        weights: JSON.stringify(weights),
        prices: prices.reduce((obj, p, i) => ({ ...obj, [tokenAddresses[i]]: p }), {}),
        timestamp: Math.floor(Date.now() / 1000),
      });

      // Update smart contract
      await this.indexRegistryService.setCuratorWeights(
        indexId,
        weightsForContract,
        Math.floor(etfPrice * 1e6), // Assume price in USD with 6 decimals
        Math.floor(Date.now() / 1000),
        8453,
      );

      this.logger.log(`Rebalanced Top 100 index with ${eligibleTokens.length} tokens`);
    } catch (error) {
      this.logger.error(`Error rebalancing Top 100 index: ${error.message}`);
      throw error;
    }
  }

  private mapCoinGeckoToToken(coinId: string): string {
    // Mock mapping (replace with actual ERC20 addresses on Base)
    const map: Record<string, string> = {
      bitcoin: '0x...',
      ethereum: '0x...',
    };
    return map[coinId] || '0x0000000000000000000000000000000000000000';
  }
}