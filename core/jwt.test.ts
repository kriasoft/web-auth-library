/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import { jwt } from "../index.js";

test("jwt.decode(token)", () => {
  const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmb28iOiJiYXIiLCJleHAiOjEzOTMyODY4OTMsImlhdCI6MTM5MzI2ODg5M30.4-iaDojEVl0pJQMjrbM1EzUIfAZgsbK_kgnVyVxFSVo"; // prettier-ignore
  const result = jwt.decode(token);

  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmb28iOiJiYXIiLCJleHAiOjEzOTMyODY4OTMsImlhdCI6MTM5MzI2ODg5M30",
      "header": Object {
        "alg": "HS256",
        "typ": "JWT",
      },
      "payload": Object {
        "exp": 1393286893,
        "foo": "bar",
        "iat": 1393268893,
      },
      "signature": "4-iaDojEVl0pJQMjrbM1EzUIfAZgsbK_kgnVyVxFSVo",
    }
  `);
});

test("jwt.decode(unicodeToken)", () => {
  const unicodeToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9zw6kiLCJpYXQiOjE0MjU2NDQ5NjZ9.1CfFtdGUPs6q8kT3OGQSVlhEMdbuX0HfNSqum0023a0"; // prettier-ignore
  const result = jwt.decode(unicodeToken);

  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9zw6kiLCJpYXQiOjE0MjU2NDQ5NjZ9",
      "header": Object {
        "alg": "HS256",
        "typ": "JWT",
      },
      "payload": Object {
        "iat": 1425644966,
        "name": "José",
      },
      "signature": "1CfFtdGUPs6q8kT3OGQSVlhEMdbuX0HfNSqum0023a0",
    }
  `);
});

test("jwt.decode(binaryToken)", () => {
  const binaryToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9z6SIsImlhdCI6MTQyNTY0NDk2Nn0.cpnplCBxiw7Xqz5thkqs4Mo_dymvztnI0CI4BN0d1t8"; // prettier-ignore
  const result = jwt.decode(binaryToken);

  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9z6SIsImlhdCI6MTQyNTY0NDk2Nn0",
      "header": Object {
        "alg": "HS256",
        "typ": "JWT",
      },
      "payload": Object {
        "iat": 1425644966,
        "name": "Jos�",
      },
      "signature": "cpnplCBxiw7Xqz5thkqs4Mo_dymvztnI0CI4BN0d1t8",
    }
  `);
});
