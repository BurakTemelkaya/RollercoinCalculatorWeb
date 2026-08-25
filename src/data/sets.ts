export interface SetLevel {
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

export interface SetRack {
    id: string;
    power_percent: number;
    title: {
        en: string;
        cn?: string;
        pt?: string;
        es?: string;
    };
}

export interface SetMiner {
    item_id: string;
    title: {
        en: string;
        cn?: string;
        pt?: string;
        es?: string;
    };
    filename: string;
    level: number;
    bonus_percent: number;
    power: number;
    type: string;
    is_in_set: boolean;
}

export interface RollercoinSet {
    title: {
        en: string;
        cn?: string;
        pt?: string;
        es?: string;
    };
    rack?: SetRack;
    levels: SetLevel[];
    miners?: SetMiner[];
}

export const SETS_DATA: RollercoinSet[] = [
    {
        "title": {
            "en": "The Lost Treasure Set",
            "cn": "The Lost Treasure Set",
            "es": "The Lost Treasure Set",
            "pt": "The Lost Treasure Set"
        },
        "rack": {
            "id": "6a3a88d9576051c2077089cf",
            "power_percent": 2300,
            "title": {
                "en": "The Lost Treasure Rack 8",
                "cn": "The Lost Treasure Rack 8",
                "es": "The Lost Treasure Rack 8",
                "pt": "The Lost Treasure Rack 8"
            }
        },
        "levels": [
            {
                "title": {
                    "en": "+20% Bonus Power",
                    "cn": "+20% Bonus Power",
                    "es": "+20% Bonus Power",
                    "pt": "+20% Bonus Power"
                },
                "level": 1,
                "bonus_power": 0,
                "percent_power": 2000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 2
            },
            {
                "title": {
                    "en": "+50% Bonus Power",
                    "cn": "+50% Bonus Power",
                    "es": "+50% Bonus Power",
                    "pt": "+50% Bonus Power"
                },
                "level": 2,
                "bonus_power": 0,
                "percent_power": 5000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 3
            },
            {
                "title": {
                    "en": "+80% Bonus Power",
                    "cn": "+80% Bonus Power",
                    "es": "+80% Bonus Power",
                    "pt": "+80% Bonus Power"
                },
                "level": 3,
                "bonus_power": 0,
                "percent_power": 8000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 4
            }
        ],
        "miners": [
            {
                "item_id": "6a2ff9fc728342e342f65061",
                "title": {
                    "en": "Manners & Mayhem",
                    "cn": "Manners & Mayhem",
                    "es": "Manners & Mayhem",
                    "pt": "Manners & Mayhem"
                },
                "filename": "manners_&_mayhem",
                "level": 4,
                "bonus_percent": 3100,
                "power": 50000000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "6a2ff9fc728342e342f65068",
                "title": {
                    "en": "Manners & Mayhem",
                    "cn": "Manners & Mayhem",
                    "es": "Manners & Mayhem",
                    "pt": "Manners & Mayhem"
                },
                "filename": "manners_&_mayhem",
                "level": 5,
                "bonus_percent": 5000,
                "power": 150000000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "6a2ffb46728342e342f6562e",
                "title": {
                    "en": "Gilded Greed",
                    "cn": "Gilded Greed",
                    "es": "Gilded Greed",
                    "pt": "Gilded Greed"
                },
                "filename": "gilded_greed",
                "level": 4,
                "bonus_percent": 3500,
                "power": 120000000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "6a2ffb46728342e342f65635",
                "title": {
                    "en": "Gilded Greed",
                    "cn": "Gilded Greed",
                    "es": "Gilded Greed",
                    "pt": "Gilded Greed"
                },
                "filename": "gilded_greed",
                "level": 5,
                "bonus_percent": 5500,
                "power": 350000000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "6a2ffbe5728342e342f65839",
                "title": {
                    "en": "Wrongway Atlas",
                    "cn": "Wrongway Atlas",
                    "es": "Wrongway Atlas",
                    "pt": "Wrongway Atlas"
                },
                "filename": "wrongway_atlas",
                "level": 4,
                "bonus_percent": 4400,
                "power": 300000000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "6a2ffbe5728342e342f65840",
                "title": {
                    "en": "Wrongway Atlas",
                    "cn": "Wrongway Atlas",
                    "es": "Wrongway Atlas",
                    "pt": "Wrongway Atlas"
                },
                "filename": "wrongway_atlas",
                "level": 5,
                "bonus_percent": 6500,
                "power": 800000000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "6a2ffcf8728342e342f65c2f",
                "title": {
                    "en": "Drama Chest",
                    "cn": "Drama Chest",
                    "es": "Drama Chest",
                    "pt": "Drama Chest"
                },
                "filename": "drama_chest",
                "level": 4,
                "bonus_percent": 5000,
                "power": 600000000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "6a2ffcf8728342e342f65c36",
                "title": {
                    "en": "Drama Chest",
                    "cn": "Drama Chest",
                    "es": "Drama Chest",
                    "pt": "Drama Chest"
                },
                "filename": "drama_chest",
                "level": 5,
                "bonus_percent": 8000,
                "power": 2000000000,
                "type": "merge",
                "is_in_set": true
            }
        ]
    },
    {
        "title": {
            "en": "Beer Pack Set",
            "cn": "Beer Pack Set",
            "es": "Beer Pack Set",
            "pt": "Beer Pack Set"
        },
        "rack": {
            "id": "66ead2f925874d2ef6d0db6a",
            "power_percent": 0,
            "title": {
                "en": "Beer Rack 6",
                "cn": "Beer Rack 6",
                "es": "Beer Rack 6",
                "pt": "Beer Rack 6"
            }
        },
        "levels": [
            {
                "title": {
                    "en": "+5.000.000 Gh/s",
                    "cn": "+5.000.000 Gh/s",
                    "es": "+5.000.000 Gh/s",
                    "pt": "+5.000.000 Gh/s"
                },
                "level": 1,
                "bonus_power": 5000000,
                "percent_power": 0,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 2
            },
            {
                "title": {
                    "en": "+8.000.000 Gh/s",
                    "cn": "+8.000.000 Gh/s",
                    "es": "+8.000.000 Gh/s",
                    "pt": "+8.000.000 Gh/s"
                },
                "level": 2,
                "bonus_power": 8000000,
                "percent_power": 0,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 3
            }
        ],
        "miners": [
            {
                "item_id": "66ead191e0dd3530da969e5f",
                "title": {
                    "en": "Just One Beer"
                },
                "filename": "just_one_beer",
                "level": 0,
                "bonus_percent": 150,
                "power": 250000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "66ead1cde0dd3530da969ea9",
                "title": {
                    "en": "Just Enough"
                },
                "filename": "just_enough",
                "level": 0,
                "bonus_percent": 250,
                "power": 760000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "66ead1fbe0dd3530da969ef3",
                "title": {
                    "en": "Das Ist Gut"
                },
                "filename": "das_ist_gut",
                "level": 0,
                "bonus_percent": 300,
                "power": 1500000,
                "type": "basic",
                "is_in_set": true
            }
        ]
    },
    {
        "title": {
            "en": "Radio Set"
        },
        "rack": {
            "id": "69490713568b0838531375a8",
            "power_percent": 1000,
            "title": {
                "en": "Radio Rack 8"
            }
        },
        "levels": [
            {
                "title": {
                    "en": "+40% Bonus Power"
                },
                "level": 1,
                "bonus_power": 0,
                "percent_power": 4000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 2
            },
            {
                "title": {
                    "en": "+60% Bonus Power"
                },
                "level": 2,
                "bonus_power": 0,
                "percent_power": 6000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 3
            },
            {
                "title": {
                    "en": "+90% Bonus Power"
                },
                "level": 3,
                "bonus_power": 0,
                "percent_power": 9000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 4
            }
        ],
        "miners": [
            {
                "item_id": "693bd585b13b27427ba89ee7",
                "title": {
                    "en": "Vote Fired"
                },
                "filename": "vote_fired",
                "level": 3,
                "bonus_percent": 4500,
                "power": 55000000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "693bd5f1b13b27427ba8a5c2",
                "title": {
                    "en": "Signar Search"
                },
                "filename": "signar_search",
                "level": 3,
                "bonus_percent": 5000,
                "power": 95000000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "693bd705b13b27427ba8ac8e",
                "title": {
                    "en": "Friendship is Magic"
                },
                "filename": "friendship_is_magic",
                "level": 3,
                "bonus_percent": 5500,
                "power": 130000000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "693bd7d2b13b27427ba8af47",
                "title": {
                    "en": "Roller Radio"
                },
                "filename": "roller_radio",
                "level": 3,
                "bonus_percent": 6000,
                "power": 320000000,
                "type": "merge",
                "is_in_set": true
            }
        ]
    },
    {
        "title": {
            "en": "Power-Up Set"
        },
        "rack": {
            "id": "66d575abd864b944e0a13b78",
            "power_percent": 0,
            "title": {
                "en": "Power-Up Rack 6"
            }
        },
        "levels": [
            {
                "title": {
                    "en": "+5.000.000 Gh/s"
                },
                "level": 1,
                "bonus_power": 5000000,
                "percent_power": 0,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 2
            },
            {
                "title": {
                    "en": "+10.000.000 Gh/s"
                },
                "level": 2,
                "bonus_power": 10000000,
                "percent_power": 0,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 3
            }
        ],
        "miners": [
            {
                "item_id": "66c31aecb82bcb27662d2f53",
                "title": {
                    "en": "Quantum Conductor"
                },
                "filename": "quantum_conductor",
                "level": 0,
                "bonus_percent": 75,
                "power": 704000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "66c31b17b82bcb27662d302b",
                "title": {
                    "en": "Energy Amplifier"
                },
                "filename": "energy_amplifier",
                "level": 0,
                "bonus_percent": 100,
                "power": 1120000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "66c31b3eb82bcb27662d30d8",
                "title": {
                    "en": "Nano-Node Extractor"
                },
                "filename": "nano_node_extractor",
                "level": 0,
                "bonus_percent": 100,
                "power": 1440000,
                "type": "basic",
                "is_in_set": true
            }
        ]
    },
    {
        "title": {
            "en": "Silver Farm Set"
        },
        "rack": {
            "id": "668d20dd5a25375fc8033338",
            "power_percent": 0,
            "title": {
                "en": "SilverOrganic Rack 8"
            }
        },
        "levels": [
            {
                "title": {
                    "en": "+2.000.000 Gh/s"
                },
                "level": 1,
                "bonus_power": 2000000,
                "percent_power": 0,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 2
            },
            {
                "title": {
                    "en": "+3.000.000 Gh/s"
                },
                "level": 2,
                "bonus_power": 3000000,
                "percent_power": 0,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 4
            }
        ],
        "miners": [
            {
                "item_id": "6687ce4e7643815232d65297",
                "title": {
                    "en": "SilverBerries"
                },
                "filename": "silverberries",
                "level": 0,
                "bonus_percent": 0,
                "power": 260000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6687cea87643815232d65882",
                "title": {
                    "en": "SilverMulberries"
                },
                "filename": "silvermulberries",
                "level": 0,
                "bonus_percent": 50,
                "power": 350000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6687ced67643815232d65cc8",
                "title": {
                    "en": "SilverCabbage"
                },
                "filename": "silvercabbage",
                "level": 0,
                "bonus_percent": 75,
                "power": 750000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6687cefd7643815232d65d11",
                "title": {
                    "en": "SilverWheat"
                },
                "filename": "silverwheat",
                "level": 0,
                "bonus_percent": 100,
                "power": 1000000,
                "type": "basic",
                "is_in_set": true
            }
        ]
    },
    {
        "title": {
            "en": "Bronze Farm Set"
        },
        "rack": {
            "id": "668d1fb75a25375fc8033336",
            "power_percent": 0,
            "title": {
                "en": "BronzeOrganic Rack 8"
            }
        },
        "levels": [
            {
                "title": {
                    "en": "+1.500.000 Gh/s"
                },
                "level": 1,
                "bonus_power": 1500000,
                "percent_power": 0,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 2
            },
            {
                "title": {
                    "en": "+2.500.000 Gh/s"
                },
                "level": 2,
                "bonus_power": 2500000,
                "percent_power": 0,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 4
            }
        ],
        "miners": [
            {
                "item_id": "6687ccfc7643815232d6402d",
                "title": {
                    "en": "BronzeCorn"
                },
                "filename": "bronzecorn",
                "level": 0,
                "bonus_percent": 0,
                "power": 250000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6687cd307643815232d64077",
                "title": {
                    "en": "BronzeTomato"
                },
                "filename": "bronzetomato",
                "level": 0,
                "bonus_percent": 0,
                "power": 300000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6687cd837643815232d640c1",
                "title": {
                    "en": "BronzeBlueberries"
                },
                "filename": "bronzeblueberries",
                "level": 0,
                "bonus_percent": 50,
                "power": 350000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6687cdc47643815232d64726",
                "title": {
                    "en": "BronzePumpkin"
                },
                "filename": "bronzepumpkin",
                "level": 0,
                "bonus_percent": 100,
                "power": 550000,
                "type": "basic",
                "is_in_set": true
            }
        ]
    },
    {
        "title": {
            "en": "Roadside Stars Set"
        },
        "rack": {
            "id": "6a7b40a8f188bab31b1c2196",
            "power_percent": 1000,
            "title": {
                "en": "Roadside Rack 8"
            }
        },
        "levels": [
            {
                "title": {
                    "en": "+20% Bonus Power"
                },
                "level": 1,
                "bonus_power": 0,
                "percent_power": 2000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 2
            },
            {
                "title": {
                    "en": "+50% Bonus Power"
                },
                "level": 2,
                "bonus_power": 0,
                "percent_power": 5000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 3
            },
            {
                "title": {
                    "en": "+80% Bonus Power"
                },
                "level": 3,
                "bonus_power": 0,
                "percent_power": 8000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 4
            }
        ],
        "miners": [
            {
                "item_id": "6a6b37f8fb30ddde603e6832",
                "title": {
                    "en": "Taco Turn"
                },
                "filename": "taco_turn",
                "level": 4,
                "bonus_percent": 3100,
                "power": 100000000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "6a6b37f8fb30ddde603e6839",
                "title": {
                    "en": "Taco Turn"
                },
                "filename": "taco_turn",
                "level": 5,
                "bonus_percent": 5000,
                "power": 250000000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "6a6b3831fb30ddde603e6a81",
                "title": {
                    "en": "Burger Boulevard"
                },
                "filename": "burger_boulevard",
                "level": 4,
                "bonus_percent": 3500,
                "power": 250000000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "6a6b3831fb30ddde603e6a88",
                "title": {
                    "en": "Burger Boulevard"
                },
                "filename": "burger_boulevard",
                "level": 5,
                "bonus_percent": 5500,
                "power": 650000000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "6a6b3869fb30ddde603e6d8e",
                "title": {
                    "en": "Hot Dog Highway"
                },
                "filename": "hot_dog_highway",
                "level": 4,
                "bonus_percent": 4400,
                "power": 500000000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "6a6b3869fb30ddde603e6d95",
                "title": {
                    "en": "Hot Dog Highway"
                },
                "filename": "hot_dog_highway",
                "level": 5,
                "bonus_percent": 6500,
                "power": 1250000000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "6a6b38effb30ddde603e7062",
                "title": {
                    "en": "Sushi Stop"
                },
                "filename": "sushi_stop",
                "level": 4,
                "bonus_percent": 5000,
                "power": 1200000000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "6a6b38effb30ddde603e7069",
                "title": {
                    "en": "Sushi Stop"
                },
                "filename": "sushi_stop",
                "level": 5,
                "bonus_percent": 8000,
                "power": 3500000000,
                "type": "merge",
                "is_in_set": true
            }
        ]
    },
    {
        "title": {
            "en": "Beach Set"
        },
        "rack": {
            "id": "6a675eaa00b27e15643511be",
            "power_percent": 2000,
            "title": {
                "en": "Beach Rack 8"
            }
        },
        "levels": [
            {
                "title": {
                    "en": "+50% Bonus Power"
                },
                "level": 1,
                "bonus_power": 0,
                "percent_power": 5000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 2
            },
            {
                "title": {
                    "en": "+100% Bonus Power"
                },
                "level": 2,
                "bonus_power": 0,
                "percent_power": 10000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 3
            },
            {
                "title": {
                    "en": "+250% Bonus Power"
                },
                "level": 3,
                "bonus_power": 0,
                "percent_power": 25000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 4
            }
        ],
        "miners": [
            {
                "item_id": "6a67228ae95dfedc67ce47e4",
                "title": {
                    "en": "Mine-a Colada"
                },
                "filename": "mine_a_colada",
                "level": 0,
                "bonus_percent": 7000,
                "power": 4000000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6a6722abe95dfedc67ce4882",
                "title": {
                    "en": "Tai One On"
                },
                "filename": "tai_one_on",
                "level": 0,
                "bonus_percent": 6000,
                "power": 3500000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6a6722e0e95dfedc67ce4965",
                "title": {
                    "en": "Bartender"
                },
                "filename": "bartender",
                "level": 0,
                "bonus_percent": 4000,
                "power": 1500000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6a67233ee95dfedc67ce4d20",
                "title": {
                    "en": "Salt & Vault"
                },
                "filename": "salt_&_vault",
                "level": 0,
                "bonus_percent": 3000,
                "power": 1000000000,
                "type": "basic",
                "is_in_set": true
            }
        ]
    },
    {
        "title": {
            "en": "Royal Set"
        },
        "rack": {
            "id": "690a70aae6988d19928d7101",
            "power_percent": 1000,
            "title": {
                "en": "Royal Rack 8"
            }
        },
        "levels": [
            {
                "title": {
                    "en": "+25% Bonus Power"
                },
                "level": 1,
                "bonus_power": 0,
                "percent_power": 2500,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 2
            },
            {
                "title": {
                    "en": "+45% Bonus Power"
                },
                "level": 2,
                "bonus_power": 0,
                "percent_power": 4500,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 4
            }
        ],
        "miners": [
            {
                "item_id": "6909e329dbb4b86eca7f2489",
                "title": {
                    "en": "Diamond Note"
                },
                "filename": "diamond_note",
                "level": 0,
                "bonus_percent": 200,
                "power": 2500000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6909e357dbb4b86eca7f24fa",
                "title": {
                    "en": "Club Note"
                },
                "filename": "club_note",
                "level": 0,
                "bonus_percent": 400,
                "power": 4000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6909e395dbb4b86eca7f273b",
                "title": {
                    "en": "Heart Note"
                },
                "filename": "heart_note",
                "level": 0,
                "bonus_percent": 600,
                "power": 10000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6909e3d4dbb4b86eca7f286c",
                "title": {
                    "en": "Spade Note"
                },
                "filename": "spade_note",
                "level": 0,
                "bonus_percent": 800,
                "power": 11500000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6909e466dbb4b86eca7f2925",
                "title": {
                    "en": "Royal Note"
                },
                "filename": "royal_note",
                "level": 0,
                "bonus_percent": 1200,
                "power": 16000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6909e466dbb4b86eca7f2928",
                "title": {
                    "en": "Royal Note"
                },
                "filename": "royal_note",
                "level": 1,
                "bonus_percent": 2400,
                "power": 50000000,
                "type": "merge",
                "is_in_set": true
            }
        ]
    },
    {
        "title": {
            "en": "Designer Set"
        },
        "rack": {
            "id": "684957c04df6651d4d5db391",
            "power_percent": 1000,
            "title": {
                "en": "Showcase Rack 8"
            }
        },
        "levels": [
            {
                "title": {
                    "en": "+15% Bonus Power"
                },
                "level": 1,
                "bonus_power": 0,
                "percent_power": 1500,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 2
            },
            {
                "title": {
                    "en": "+40% Bonus Power"
                },
                "level": 2,
                "bonus_power": 0,
                "percent_power": 4000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 4
            },
            {
                "title": {
                    "en": "+75% Bonus Power"
                },
                "level": 3,
                "bonus_power": 0,
                "percent_power": 7500,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 6
            },
            {
                "title": {
                    "en": "+120% Bonus Power"
                },
                "level": 4,
                "bonus_power": 0,
                "percent_power": 12000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 8
            }
        ],
        "miners": [
            {
                "item_id": "68494781ccf7adb5d765052d",
                "title": {
                    "en": "Hames Hirkin"
                },
                "filename": "hames_hirkin",
                "level": 0,
                "bonus_percent": 500,
                "power": 30000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "684947c1ccf7adb5d76505a6",
                "title": {
                    "en": "Hamel Classic"
                },
                "filename": "hamel_classic",
                "level": 0,
                "bonus_percent": 800,
                "power": 25000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "68626962411d00ff277d76e9",
                "title": {
                    "en": "Hamior Lady"
                },
                "filename": "hamior_lady",
                "level": 0,
                "bonus_percent": 400,
                "power": 9000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "68626997411d00ff277d7a18",
                "title": {
                    "en": "Hames Hamelly"
                },
                "filename": "hames_hamelly",
                "level": 0,
                "bonus_percent": 700,
                "power": 18000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "686269cb411d00ff277d7a80",
                "title": {
                    "en": "Hamior Haddle"
                },
                "filename": "hamior_haddle",
                "level": 0,
                "bonus_percent": 500,
                "power": 10000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "686269fb411d00ff277d7b8d",
                "title": {
                    "en": "Hamuis Hamton"
                },
                "filename": "hamuis_hamton",
                "level": 0,
                "bonus_percent": 800,
                "power": 20000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "68626a5c411d00ff277d815a",
                "title": {
                    "en": "Hammuchi Hamhidia"
                },
                "filename": "hammuchi_hamhidia",
                "level": 0,
                "bonus_percent": 600,
                "power": 7000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "68626a8e411d00ff277d81cc",
                "title": {
                    "en": "Hiu Hamder"
                },
                "filename": "hiu_hamder",
                "level": 0,
                "bonus_percent": 1500,
                "power": 25000000,
                "type": "basic",
                "is_in_set": true
            }
        ]
    },
    {
        "title": {
            "en": "Asgardian Set"
        },
        "rack": {
            "id": "6825aaa7e2da6536108ec08e",
            "power_percent": 1000,
            "title": {
                "en": "Asgardian Rack 8"
            }
        },
        "levels": [
            {
                "title": {
                    "en": "+8% Bonus Power"
                },
                "level": 1,
                "bonus_power": 0,
                "percent_power": 800,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 2
            },
            {
                "title": {
                    "en": "+24% Bonus Power"
                },
                "level": 2,
                "bonus_power": 0,
                "percent_power": 2400,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 4
            }
        ],
        "miners": [
            {
                "item_id": "6824481dfbb67c190eed4d7d",
                "title": {
                    "en": "Aegis of Gold"
                },
                "filename": "aegis_of_gold",
                "level": 0,
                "bonus_percent": 100,
                "power": 2000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "68244844fbb67c190eed4dd7",
                "title": {
                    "en": "Voidstone"
                },
                "filename": "voidstone",
                "level": 0,
                "bonus_percent": 100,
                "power": 3000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "68244872fbb67c190eed4e6f",
                "title": {
                    "en": "Celestial Eye"
                },
                "filename": "celestial_eye",
                "level": 0,
                "bonus_percent": 200,
                "power": 8000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6824489bfbb67c190eed5222",
                "title": {
                    "en": "Divine Core"
                },
                "filename": "divine_core",
                "level": 0,
                "bonus_percent": 200,
                "power": 10000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "682448ccfbb67c190eed52bb",
                "title": {
                    "en": "Soul Devourer"
                },
                "filename": "soul_devourer",
                "level": 0,
                "bonus_percent": 450,
                "power": 16000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "682448fcfbb67c190eed530f",
                "title": {
                    "en": "Elder Beast"
                },
                "filename": "elder_beast",
                "level": 0,
                "bonus_percent": 450,
                "power": 18000000,
                "type": "basic",
                "is_in_set": true
            }
        ]
    },
    {
        "title": {
            "en": "Runners Set"
        },
        "rack": {
            "id": "67c574e988262b01d3b36b8f",
            "power_percent": 0,
            "title": {
                "en": "Runners Rack 8"
            }
        },
        "levels": [
            {
                "title": {
                    "en": "+10% Bonus Power"
                },
                "level": 1,
                "bonus_power": 0,
                "percent_power": 1000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 2
            },
            {
                "title": {
                    "en": "+20% Bonus Power"
                },
                "level": 2,
                "bonus_power": 0,
                "percent_power": 2000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 4
            }
        ],
        "miners": [
            {
                "item_id": "67c08778b5e8c2c0f194631d",
                "title": {
                    "en": "Ignite Runner"
                },
                "filename": "ignite_runner",
                "level": 0,
                "bonus_percent": 100,
                "power": 4000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "67c0879cb5e8c2c0f194636b",
                "title": {
                    "en": "Acid Runner"
                },
                "filename": "acid_runner",
                "level": 0,
                "bonus_percent": 100,
                "power": 7000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "67c087bcb5e8c2c0f19463b9",
                "title": {
                    "en": "Scarlet Runner"
                },
                "filename": "scarlet_runner",
                "level": 0,
                "bonus_percent": 100,
                "power": 9000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "67c087e3b5e8c2c0f1946b75",
                "title": {
                    "en": "Eva Runner"
                },
                "filename": "eva_runner",
                "level": 0,
                "bonus_percent": 200,
                "power": 15000000,
                "type": "basic",
                "is_in_set": true
            }
        ]
    },
    {
        "title": {
            "en": "Globes Set"
        },
        "rack": {
            "id": "6752f0a50b2ea70a05bc1c5c",
            "power_percent": 1000,
            "title": {
                "en": "Globes Rack 8"
            }
        },
        "levels": [
            {
                "title": {
                    "en": "+10.000.000 Gh/s"
                },
                "level": 1,
                "bonus_power": 10000000,
                "percent_power": 0,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 2
            },
            {
                "title": {
                    "en": "+25.000.000 Gh/s"
                },
                "level": 2,
                "bonus_power": 25000000,
                "percent_power": 0,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 4
            }
        ],
        "miners": [
            {
                "item_id": "674df539cbe1e47b27075a68",
                "title": {
                    "en": "BellGlobe"
                },
                "filename": "bellglobe",
                "level": 0,
                "bonus_percent": 100,
                "power": 650000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "674df56acbe1e47b27075ab6",
                "title": {
                    "en": "BowGlobe"
                },
                "filename": "bowglobe",
                "level": 0,
                "bonus_percent": 100,
                "power": 1400000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "674df599cbe1e47b27075b04",
                "title": {
                    "en": "ToyGlobe"
                },
                "filename": "toyglobe",
                "level": 0,
                "bonus_percent": 200,
                "power": 2100000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "674df5c5cbe1e47b27075b51",
                "title": {
                    "en": "WishGlobe"
                },
                "filename": "wishglobe",
                "level": 0,
                "bonus_percent": 300,
                "power": 2700000,
                "type": "basic",
                "is_in_set": true
            }
        ]
    },
    {
        "title": {
            "en": "Super Bros Set"
        },
        "rack": {
            "id": "673481872593c7f3e68fcc9a",
            "power_percent": 0,
            "title": {
                "en": "Retro Arcade Rack 6"
            }
        },
        "levels": [
            {
                "title": {
                    "en": "+7.500.000 Gh/s"
                },
                "level": 1,
                "bonus_power": 7500000,
                "percent_power": 0,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 2
            },
            {
                "title": {
                    "en": "+15.000.000 Gh/s"
                },
                "level": 2,
                "bonus_power": 15000000,
                "percent_power": 0,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 3
            }
        ],
        "miners": [
            {
                "item_id": "67338298d9b2852bde4afb0d",
                "title": {
                    "en": "Miner Bros Classic"
                },
                "filename": "miner_bros_classic",
                "level": 0,
                "bonus_percent": 100,
                "power": 1960000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "67338357d9b2852bde4b077d",
                "title": {
                    "en": "Miner Bros Advanced"
                },
                "filename": "miner_bros_advanced",
                "level": 0,
                "bonus_percent": 100,
                "power": 4560000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "67338415d9b2852bde4b0dc6",
                "title": {
                    "en": "Miner Bros Pro"
                },
                "filename": "miner_bros_pro",
                "level": 0,
                "bonus_percent": 100,
                "power": 6000000,
                "type": "basic",
                "is_in_set": true
            }
        ]
    },
    {
        "title": {
            "en": "Alien Set"
        },
        "rack": {
            "id": "66fa99522d94b5111cd82dd6",
            "power_percent": 0,
            "title": {
                "en": "Alien Rack 8"
            }
        },
        "levels": [
            {
                "title": {
                    "en": "+5% Bonus Power"
                },
                "level": 1,
                "bonus_power": 0,
                "percent_power": 500,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 2
            },
            {
                "title": {
                    "en": "+10% Bonus Power"
                },
                "level": 2,
                "bonus_power": 0,
                "percent_power": 1000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 4
            }
        ],
        "miners": [
            {
                "item_id": "66f1c18fe0dd3530daa2e8dd",
                "title": {
                    "en": "Codename Blue"
                },
                "filename": "codename_blue",
                "level": 0,
                "bonus_percent": 50,
                "power": 1200000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "66f1c1b9e0dd3530daa2e9df",
                "title": {
                    "en": "Codename Red"
                },
                "filename": "codename_red",
                "level": 0,
                "bonus_percent": 50,
                "power": 1450000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "66f1c1dee0dd3530daa2ea96",
                "title": {
                    "en": "Codename Green"
                },
                "filename": "codename_green",
                "level": 0,
                "bonus_percent": 100,
                "power": 1800000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "66f1c200e0dd3530daa2eadf",
                "title": {
                    "en": "Codename Gold"
                },
                "filename": "codename_gold",
                "level": 0,
                "bonus_percent": 100,
                "power": 2900000,
                "type": "basic",
                "is_in_set": true
            }
        ]
    },
    {
        "title": {
            "en": "IMPERIAL Set"
        },
        "rack": {
            "id": "66e96311559df49edab6ebcb",
            "power_percent": 1000,
            "title": {
                "en": "DOMINION Rack 6"
            }
        },
        "levels": [
            {
                "title": {
                    "en": "+5% Bonus Power"
                },
                "level": 1,
                "bonus_power": 0,
                "percent_power": 500,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 2
            },
            {
                "title": {
                    "en": "+10% Bonus Power"
                },
                "level": 2,
                "bonus_power": 0,
                "percent_power": 1000,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 3
            }
        ],
        "miners": [
            {
                "item_id": "66e40f06e0dd3530da8bf564",
                "title": {
                    "en": "Romulus IMPERIUM"
                },
                "filename": "romulus_imperium",
                "level": 0,
                "bonus_percent": 200,
                "power": 23000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "66e40f32e0dd3530da8bf7da",
                "title": {
                    "en": "Conquest IMPERIUM"
                },
                "filename": "conquest_imperium",
                "level": 0,
                "bonus_percent": 1000,
                "power": 204000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "66e40f5de0dd3530da8bfa3a",
                "title": {
                    "en": "PAX IMPERIUM"
                },
                "filename": "pax_imperium",
                "level": 0,
                "bonus_percent": 1500,
                "power": 465000000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "674882691745a1e9ed4c3d56",
                "title": {
                    "en": "Romulus IMPERIUM"
                },
                "filename": "romulus_imperium",
                "level": 1,
                "bonus_percent": 500,
                "power": 60380000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "674882691745a1e9ed4c3d5e",
                "title": {
                    "en": "Romulus IMPERIUM"
                },
                "filename": "romulus_imperium",
                "level": 2,
                "bonus_percent": 1100,
                "power": 158500000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "674882a81745a1e9ed4c3e66",
                "title": {
                    "en": "Conquest IMPERIUM"
                },
                "filename": "conquest_imperium",
                "level": 1,
                "bonus_percent": 1300,
                "power": 535500000,
                "type": "merge",
                "is_in_set": true
            },
            {
                "item_id": "674882a81745a1e9ed4c3e6e",
                "title": {
                    "en": "Conquest IMPERIUM"
                },
                "filename": "conquest_imperium",
                "level": 2,
                "bonus_percent": 1900,
                "power": 1405690000,
                "type": "merge",
                "is_in_set": true
            }
        ]
    },
    {
        "title": {
            "en": "Golden Farm Set"
        },
        "rack": {
            "id": "668d213a5a25375fc8033339",
            "power_percent": 0,
            "title": {
                "en": "GoldenOrganic Rack 8"
            }
        },
        "levels": [
            {
                "title": {
                    "en": "+2% Bonus Power"
                },
                "level": 1,
                "bonus_power": 0,
                "percent_power": 200,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 2
            },
            {
                "title": {
                    "en": "+7% Bonus Power"
                },
                "level": 2,
                "bonus_power": 0,
                "percent_power": 700,
                "additional_set_percent": 0,
                "condition_type": "unique_miner",
                "condition_amount": 4
            }
        ],
        "miners": [
            {
                "item_id": "6687cf557643815232d65d5c",
                "title": {
                    "en": "GoldenCarrot"
                },
                "filename": "goldencarrot",
                "level": 0,
                "bonus_percent": 25,
                "power": 250000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6687cf817643815232d65da6",
                "title": {
                    "en": "GoldenEchinopsis"
                },
                "filename": "goldenechinopsis",
                "level": 0,
                "bonus_percent": 50,
                "power": 300000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6687cfae7643815232d65def",
                "title": {
                    "en": "GoldenTomato"
                },
                "filename": "goldentomato",
                "level": 0,
                "bonus_percent": 75,
                "power": 350000,
                "type": "basic",
                "is_in_set": true
            },
            {
                "item_id": "6687cfd57643815232d65e39",
                "title": {
                    "en": "GoldenMelon"
                },
                "filename": "goldenmelon",
                "level": 0,
                "bonus_percent": 100,
                "power": 400000,
                "type": "basic",
                "is_in_set": true
            }
        ]
    }
];
