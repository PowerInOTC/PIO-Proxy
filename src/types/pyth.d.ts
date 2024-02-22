export interface PythPrice {
    conf: string;
    expo: number;
    price: string;
    publish_time: number;
}

export interface PythPriceFeedMetadata {
    attestation_time?: number;
    emitter_chain: number;
    prev_publish_time?: number;
    price_service_receive_time?: number;
    sequence_number?: number;
    slot?: number;
}

export interface PythPriceFeed {
    ema_price: PythPrice;
    id: string;
    metadata?: PythPriceFeedMetadata;
    price: PythPrice;
    vaa?: string;
}
