export type MarketOffer = { price: number; quantity: number };
export type MarketFill = MarketOffer & { estimated?: boolean };
export type MarketBooks = Record<number, MarketOffer[] | undefined>;
/** Consume known levels cheapest first, then estimate the remainder at the highest returned price. */
export function quoteMarket(offers: MarketOffer[] | undefined, quantity: number) {
    let remaining = quantity, total = 0;
    const fills: MarketFill[] = [];
    if (!Number.isSafeInteger(quantity) || quantity < 0) return { complete:false, total:0, average:0, filled:0, missing:quantity, estimatedQuantity:0, knownQuantity:0, fills };
    const levels = [...(offers ?? [])].filter(x => Number.isSafeInteger(x.price) && x.price > 0 && Number.isSafeInteger(x.quantity) && x.quantity > 0).sort((a,b)=>a.price-b.price);
    for (const offer of levels) {
        const take = Math.min(remaining, offer.quantity);
        if (!take) break;
        total += take * offer.price; remaining -= take; fills.push({price:offer.price,quantity:take});
    }
    const knownQuantity = quantity - remaining;
    const estimatedQuantity = levels.length ? remaining : 0;
    if (estimatedQuantity) {
        const price = levels[levels.length - 1].price;
        total += estimatedQuantity * price;
        fills.push({price,quantity:estimatedQuantity,estimated:true}); remaining = 0;
    }
    const filled = quantity - remaining;
    return { complete:remaining===0 && Number.isSafeInteger(total), total, average:filled ? total/filled : 0, filled, missing:remaining, estimatedQuantity, knownQuantity, fills };
}
