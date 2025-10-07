/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/fruitninja.json`.
 */
export type Fruitninja = {
  "address": "2yTboNmZbPJJey7Cf3mUyW1AyUc2m4rdWiCGg8qKMQq4",
  "metadata": {
    "name": "fruitninja",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "checkpointSession",
      "docs": [
        "Periodic commit while still delegated (checkpoint)"
      ],
      "discriminator": [
        165,
        118,
        83,
        246,
        35,
        221,
        81,
        102
      ],
      "accounts": [
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "session.player",
                "account": "gameSession"
              }
            ]
          }
        },
        {
          "name": "magicContext",
          "docs": [
            "Anchor cannot verify this account. Safety is guaranteed by the SDK."
          ],
          "writable": true
        },
        {
          "name": "magicProgram",
          "docs": [
            "Safety is guaranteed by the SDK; used only for commit/checkpoint calls."
          ]
        },
        {
          "name": "payer",
          "docs": [
            "Payer / authority account required by the SDK helper"
          ],
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "commitSession",
      "docs": [
        "Manual commit without undelegation (for periodic checkpoints)"
      ],
      "discriminator": [
        75,
        2,
        56,
        144,
        89,
        208,
        173,
        167
      ],
      "accounts": [
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "session.player",
                "account": "gameSession"
              }
            ]
          }
        },
        {
          "name": "magicContext",
          "docs": [
            "Anchor cannot verify this account. Safety is guaranteed by the SDK."
          ],
          "writable": true
        },
        {
          "name": "magicProgram",
          "docs": [
            "Safety is guaranteed by the SDK; used only for commit calls."
          ]
        },
        {
          "name": "payer",
          "docs": [
            "Payer / authority account required by the SDK helper"
          ],
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "delegateSession",
      "docs": [
        "Delegate the session PDA to an ER validator"
      ],
      "discriminator": [
        82,
        83,
        119,
        119,
        196,
        219,
        5,
        197
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "bufferSessionPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "sessionPda"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                29,
                82,
                73,
                248,
                28,
                194,
                174,
                148,
                78,
                223,
                55,
                229,
                213,
                216,
                182,
                22,
                179,
                16,
                129,
                90,
                163,
                15,
                46,
                121,
                0,
                170,
                12,
                96,
                239,
                139,
                27,
                159
              ]
            }
          }
        },
        {
          "name": "delegationRecordSessionPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "sessionPda"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataSessionPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "sessionPda"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "sessionPda",
          "docs": [
            "Safety is guaranteed by the Ephemeral Rollups SDK; Anchor cannot type-check it."
          ],
          "writable": true
        },
        {
          "name": "session",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "ownerProgram",
          "address": "2yTboNmZbPJJey7Cf3mUyW1AyUc2m4rdWiCGg8qKMQq4"
        },
        {
          "name": "delegationProgram",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "endSession",
      "docs": [
        "End the session and update player profile and global leaderboard",
        "NOTE: This instruction requires the GameConfig PDA (so leaderboard can be updated)."
      ],
      "discriminator": [
        11,
        244,
        61,
        154,
        212,
        249,
        15,
        66
      ],
      "accounts": [
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "session.player",
                "account": "gameSession"
              }
            ]
          }
        },
        {
          "name": "playerProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "player",
          "signer": true,
          "relations": [
            "session"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "initializeConfig",
      "docs": [
        "Admin: initialize the global config PDA (one-time)"
      ],
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "maxLives",
          "type": "u8"
        },
        {
          "name": "maxPointsPerFruit",
          "type": "u64"
        },
        {
          "name": "comboMultiplierBase",
          "type": "u64"
        },
        {
          "name": "leaderboardCapacity",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initializeProfile",
      "docs": [
        "Initialize player profile"
      ],
      "discriminator": [
        32,
        145,
        77,
        213,
        58,
        39,
        251,
        234
      ],
      "accounts": [
        {
          "name": "playerProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "username",
          "type": "string"
        }
      ]
    },
    {
      "name": "initializeSession",
      "docs": [
        "Initialize a new game session for a player"
      ],
      "discriminator": [
        69,
        130,
        92,
        236,
        107,
        231,
        159,
        129
      ],
      "accounts": [
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "loseLife",
      "docs": [
        "Lose a life when player misses or hits a bomb"
      ],
      "discriminator": [
        117,
        250,
        96,
        174,
        113,
        6,
        164,
        13
      ],
      "accounts": [
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "session.player",
                "account": "gameSession"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "processUndelegation",
      "discriminator": [
        196,
        28,
        41,
        206,
        48,
        37,
        51,
        167
      ],
      "accounts": [
        {
          "name": "baseAccount",
          "writable": true
        },
        {
          "name": "buffer"
        },
        {
          "name": "payer",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "accountSeeds",
          "type": {
            "vec": "bytes"
          }
        }
      ]
    },
    {
      "name": "sliceFruit",
      "docs": [
        "Slice a fruit - increases score and combo"
      ],
      "discriminator": [
        0,
        243,
        2,
        25,
        96,
        29,
        126,
        236
      ],
      "accounts": [
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "session.player",
                "account": "gameSession"
              }
            ]
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "points",
          "type": "u64"
        }
      ]
    },
    {
      "name": "undelegateSession",
      "docs": [
        "Undelegate and commit final state"
      ],
      "discriminator": [
        110,
        234,
        80,
        245,
        77,
        79,
        58,
        116
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "session.player",
                "account": "gameSession"
              }
            ]
          }
        },
        {
          "name": "magicContext",
          "docs": [
            "Anchor cannot verify this account. Safety is guaranteed by the SDK."
          ],
          "writable": true
        },
        {
          "name": "magicProgram",
          "docs": [
            "Safety is guaranteed by the SDK; used only for commit/undelegate calls."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "updateConfig",
      "docs": [
        "Admin: update global config params (only admin signer)"
      ],
      "discriminator": [
        29,
        158,
        252,
        191,
        10,
        83,
        219,
        99
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "maxLives",
          "type": {
            "option": "u8"
          }
        },
        {
          "name": "maxPointsPerFruit",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "comboMultiplierBase",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "leaderboardCapacity",
          "type": {
            "option": "u8"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "gameConfig",
      "discriminator": [
        45,
        146,
        146,
        33,
        170,
        69,
        96,
        133
      ]
    },
    {
      "name": "gameSession",
      "discriminator": [
        150,
        116,
        20,
        197,
        205,
        121,
        220,
        240
      ]
    },
    {
      "name": "playerProfile",
      "discriminator": [
        82,
        226,
        99,
        87,
        164,
        130,
        181,
        80
      ]
    }
  ],
  "events": [
    {
      "name": "fruitSliced",
      "discriminator": [
        53,
        150,
        126,
        40,
        54,
        149,
        41,
        122
      ]
    },
    {
      "name": "gameOver",
      "discriminator": [
        122,
        28,
        20,
        209,
        123,
        166,
        111,
        64
      ]
    },
    {
      "name": "sessionCheckpoint",
      "discriminator": [
        243,
        138,
        26,
        39,
        112,
        52,
        164,
        70
      ]
    },
    {
      "name": "sessionStarted",
      "discriminator": [
        97,
        241,
        44,
        75,
        210,
        66,
        122,
        96
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "sessionNotActive",
      "msg": "Session is not active"
    },
    {
      "code": 6001,
      "name": "invalidDelegation",
      "msg": "Invalid delegation state"
    },
    {
      "code": 6002,
      "name": "invalidPoints",
      "msg": "Invalid points value or exceeds config limit"
    },
    {
      "code": 6003,
      "name": "usernameTooLong",
      "msg": "Username too long (max 32 characters)"
    },
    {
      "code": 6004,
      "name": "sessionAlreadyEnded",
      "msg": "Session already ended"
    },
    {
      "code": 6005,
      "name": "leaderboardCapacityTooLarge",
      "msg": "Leaderboard capacity too large"
    },
    {
      "code": 6006,
      "name": "unauthorized",
      "msg": "unauthorized"
    }
  ],
  "types": [
    {
      "name": "fruitSliced",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "points",
            "type": "u64"
          },
          {
            "name": "combo",
            "type": "u8"
          },
          {
            "name": "totalScore",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "gameConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "maxLives",
            "type": "u8"
          },
          {
            "name": "maxPointsPerFruit",
            "type": "u64"
          },
          {
            "name": "comboMultiplierBase",
            "type": "u64"
          },
          {
            "name": "leaderboardCapacity",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "leaderboard",
            "type": {
              "vec": {
                "defined": {
                  "name": "leaderboardEntry"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "gameOver",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "finalScore",
            "type": "u64"
          },
          {
            "name": "maxCombo",
            "type": "u8"
          },
          {
            "name": "fruitsSliced",
            "type": "u64"
          },
          {
            "name": "duration",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "gameSession",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "currentScore",
            "type": "u64"
          },
          {
            "name": "combo",
            "type": "u8"
          },
          {
            "name": "lives",
            "type": "u8"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "startedAt",
            "type": "i64"
          },
          {
            "name": "endedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "fruitsSliced",
            "type": "u64"
          },
          {
            "name": "maxCombo",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "leaderboardEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "score",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "playerProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "username",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "highScore",
            "type": "u64"
          },
          {
            "name": "totalGames",
            "type": "u64"
          },
          {
            "name": "totalFruitsSliced",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "sessionCheckpoint",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "currentScore",
            "type": "u64"
          },
          {
            "name": "combo",
            "type": "u8"
          },
          {
            "name": "fruitsSliced",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "sessionStarted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
