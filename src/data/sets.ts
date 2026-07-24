export interface SetLevel {
    _id: string;
    title: {
        en: string;
        cn?: string;
        pt?: string;
        es?: string;
    };
    level: number;
    bonus_power: number;
    percent_power: number;
    additional_set_percent: number;
    condition_type: string;
    condition_amount: number;
}

export interface RollercoinSet {
    title: {
        en: string;
        cn?: string;
        pt?: string;
        es?: string;
    };
    last_updated: string;
    levels: SetLevel[];
    is_user_has_set?: boolean;
    set_id: string;
    preview_url?: string;
}

export const SETS_DATA: RollercoinSet[] = [
    {
        "title": { "en": "Radio Set" },
        "last_updated": "2025-12-23T16:16:59.990Z",
        "levels": [
            { "_id": "694ac07bb40c0d8d98fb949f", "title": { "en": "+40% Bonus Power" }, "level": 1, "bonus_power": 0, "percent_power": 4000, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 2 },
            { "_id": "694ac07bb40c0d8d98fb94a0", "title": { "en": "+60% Bonus Power" }, "level": 2, "bonus_power": 0, "percent_power": 6000, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 3 },
            { "_id": "694ac07bb40c0d8d98fb94a1", "title": { "en": "+90% Bonus Power" }, "level": 3, "bonus_power": 0, "percent_power": 9000, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 4 }
        ],
        "set_id": "694ac07bb40c0d8d98fb9489"
    },
    {
        "title": { "en": "Power-Up Set" },
        "last_updated": "2024-09-05T14:28:56.636Z",
        "levels": [
            { "_id": "66d9c02805407b338b241ca5", "title": { "en": "+5.000.000 Gh/s" }, "level": 1, "bonus_power": 5000000, "percent_power": 0, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 2 },
            { "_id": "66d9c02805407b338b241ca6", "title": { "en": "+10.000.000 Gh/s" }, "level": 2, "bonus_power": 10000000, "percent_power": 0, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 3 }
        ],
        "set_id": "66d9c02805407b338b241ca3"
    },
    {
        "title": { "en": "Silver Farm Set" },
        "last_updated": "2024-07-16T11:40:46.586Z",
        "levels": [
            { "_id": "668e9103e65c1fd7c423b63c", "title": { "en": "+2.000.000 Gh/s" }, "level": 1, "bonus_power": 2000000, "percent_power": 0, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 2 },
            { "_id": "668e91a7e65c1fd7c423b63d", "title": { "en": "+3.000.000 Gh/s" }, "level": 2, "bonus_power": 3000000, "percent_power": 0, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 4 }
        ],
        "set_id": "668e906ae65c1fd7c423b63b"
    },
    {
        "title": { "en": "Bronze Farm Set" },
        "last_updated": "2024-07-16T11:40:46.585Z",
        "levels": [
            { "_id": "668e86f5e65c1fd7c423b639", "title": { "en": "+1.500.000 Gh/s" }, "level": 1, "bonus_power": 1500000, "percent_power": 0, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 2 },
            { "_id": "668e8734e65c1fd7c423b63a", "title": { "en": "+2.500.000 Gh/s" }, "level": 2, "bonus_power": 2500000, "percent_power": 0, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 4 }
        ],
        "set_id": "668e84b0e65c1fd7c423b638"
    },
    {
        "title": { "en": "Royal Set" },
        "last_updated": "2025-11-06T16:32:29.751Z",
        "levels": [
            { "_id": "690ccd9d95296a1a2ce738a4", "title": { "en": "+25% Bonus Power" }, "level": 1, "bonus_power": 0, "percent_power": 2500, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 2 },
            { "_id": "690ccd9d95296a1a2ce738a5", "title": { "en": "+45% Bonus Power" }, "level": 2, "bonus_power": 0, "percent_power": 4500, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 4 }
        ],
        "set_id": "690ccd9d95296a1a2ce73887"
    },
    {
        "title": { "en": "Designer Set" },
        "last_updated": "2025-06-12T11:56:52.850Z",
        "levels": [
            { "_id": "684ac0841f939ab7fbc75016", "title": { "en": "+15% Bonus Power" }, "level": 1, "bonus_power": 0, "percent_power": 1500, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 2 },
            { "_id": "684ac0841f939ab7fbc75017", "title": { "en": "+40% Bonus Power" }, "level": 2, "bonus_power": 0, "percent_power": 4000, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 4 },
            { "_id": "684ac0841f939ab7fbc75018", "title": { "en": "+75% Bonus Power" }, "level": 3, "bonus_power": 0, "percent_power": 7500, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 6 },
            { "_id": "684ac0841f939ab7fbc75019", "title": { "en": "+120% Bonus Power" }, "level": 4, "bonus_power": 0, "percent_power": 12000, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 8 }
        ],
        "set_id": "684ac0841f939ab7fbc74ffb"
    },
    {
        "title": { "en": "Asgardian Set" },
        "last_updated": "2025-05-20T10:57:02.915Z",
        "levels": [
            { "_id": "682c5ffeea5450104329aab4", "title": { "en": "+8% Bonus Power" }, "level": 1, "bonus_power": 0, "percent_power": 800, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 2 },
            { "_id": "682c5ffeea5450104329aab5", "title": { "en": "+24% Bonus Power" }, "level": 2, "bonus_power": 0, "percent_power": 2400, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 4 }
        ],
        "set_id": "682c5ffeea5450104329aab2"
    },
    {
        "title": { "en": "Runners Set" },
        "last_updated": "2025-03-04T11:15:07.922Z",
        "levels": [
            { "_id": "67c6e0bb4a0744afe5dec773", "title": { "en": "+10% Bonus Power" }, "level": 1, "bonus_power": 0, "percent_power": 1000, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 2 },
            { "_id": "67c6e0bb4a0744afe5dec774", "title": { "en": "+20% Bonus Power" }, "level": 2, "bonus_power": 0, "percent_power": 2000, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 4 }
        ],
        "set_id": "67c6e0bb4a0744afe5dec771"
    },
    {
        "title": { "en": "Globes Set" },
        "last_updated": "2024-12-11T11:41:53.975Z",
        "levels": [
            { "_id": "67597a81730e334a4e98b65b", "title": { "en": "+10.000.000 Gh/s" }, "level": 1, "bonus_power": 10000000, "percent_power": 0, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 2 },
            { "_id": "67597a81730e334a4e98b65c", "title": { "en": "+25.000.000 Gh/s" }, "level": 2, "bonus_power": 25000000, "percent_power": 0, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 4 }
        ],
        "set_id": "6752f36e0b2ea70a05bc1c5d"
    },
    {
        "title": { "en": "Super Bros Set" },
        "last_updated": "2024-11-14T14:09:39.234Z",
        "levels": [
            { "_id": "673604a36e32548a179c804b", "title": { "en": "+7.500.000 Gh/s" }, "level": 1, "bonus_power": 7500000, "percent_power": 0, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 2 },
            { "_id": "673604a36e32548a179c804c", "title": { "en": "+15.000.000 Gh/s" }, "level": 2, "bonus_power": 15000000, "percent_power": 0, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 3 }
        ],
        "set_id": "673604a36e32548a179c8049"
    },
    {
        "title": { "en": "Alien Set" },
        "last_updated": "2024-10-02T11:09:41.536Z",
        "levels": [
            { "_id": "66fd29f523dee8df7cf4ee0a", "title": { "en": "+5% Bonus Power" }, "level": 1, "bonus_power": 0, "percent_power": 500, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 2 },
            { "_id": "66fd29f523dee8df7cf4ee0b", "title": { "en": "+10% Bonus Power" }, "level": 2, "bonus_power": 0, "percent_power": 1000, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 4 }
        ],
        "set_id": "66faabd23a308d583df1155c"
    },
    {
        "title": { "en": "IMPERIAL Set" },
        "last_updated": "2024-09-19T13:47:22.993Z",
        "levels": [
            { "_id": "66ec2b6a597f29d806df2976", "title": { "en": "+5% Bonus Power" }, "level": 1, "bonus_power": 0, "percent_power": 500, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 2 },
            { "_id": "66ec2b6a597f29d806df2977", "title": { "en": "+10% Bonus Power" }, "level": 2, "bonus_power": 0, "percent_power": 1000, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 3 }
        ],
        "set_id": "66e97044559df49edab6ebcc"
    },
    {
        "title": { "en": "Beer Pack Set" },
        "last_updated": "2024-09-19T13:47:10.150Z",
        "levels": [
            { "_id": "66ec2b5e5f0458865c9b53ea", "title": { "en": "+5.000.000 Gh/s" }, "level": 1, "bonus_power": 5000000, "percent_power": 0, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 2 },
            { "_id": "66ec2b5e5f0458865c9b53eb", "title": { "en": "+8.000.000 Gh/s" }, "level": 2, "bonus_power": 8000000, "percent_power": 0, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 3 }
        ],
        "set_id": "66ec2b5e5f0458865c9b53e8"
    },
    {
        "title": { "en": "Golden Farm Set" },
        "last_updated": "2024-07-16T11:40:46.587Z",
        "levels": [
            { "_id": "668e9335e65c1fd7c423b642", "title": { "en": "+2% Bonus Power" }, "level": 1, "bonus_power": 0, "percent_power": 200, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 2 },
            { "_id": "668e9354e65c1fd7c423b643", "title": { "en": "+7% Bonus Power" }, "level": 2, "bonus_power": 0, "percent_power": 700, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 4 }
        ],
        "set_id": "668e92a2e65c1fd7c423b640"
    },
    {
        "title": { "en": "The Lost Treasure Set" },
        "last_updated": "2026-07-07T17:24:15.884Z",
        "levels": [
            { "_id": "6a4d363f5e87cb5f62a0c15e", "title": { "en": "+20% Bonus Power" }, "level": 1, "bonus_power": 0, "percent_power": 2000, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 2 },
            { "_id": "6a4d363f5e87cb5f62a0c15f", "title": { "en": "+50% Bonus Power" }, "level": 2, "bonus_power": 0, "percent_power": 5000, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 3 },
            { "_id": "6a4d363f5e87cb5f62a0c160", "title": { "en": "+80% Bonus Power" }, "level": 3, "bonus_power": 0, "percent_power": 8000, "additional_set_percent": 0, "condition_type": "unique_miner", "condition_amount": 4 }
        ],
        "set_id": "6a4d363f5e87cb5f62a0c135"
    }
];
