/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import { jwt } from "../index.js";

const tokens = [
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmb28iOiJiYXIiLCJleHAiOjEzOTMyODY4OTMsImlhdCI6MTM5MzI2ODg5M30.4-iaDojEVl0pJQMjrbM1EzUIfAZgsbK_kgnVyVxFSVo",
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9zw6kiLCJpYXQiOjE0MjU2NDQ5NjZ9.1CfFtdGUPs6q8kT3OGQSVlhEMdbuX0HfNSqum0023a0",
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9z6SIsImlhdCI6MTQyNTY0NDk2Nn0.cpnplCBxiw7Xqz5thkqs4Mo_dymvztnI0CI4BN0d1t8",
];

test("jwt.decode(token)", () => {
  const token = tokens[0];
  const result = jwt.decode(token);

  expect(result).toMatchInlineSnapshot(`
    Object {
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

test("jwt.decode(token, { header: false })", () => {
  const token = tokens[0];
  const result = jwt.decode(token, { header: false });

  expect(result).toMatchInlineSnapshot(`
    Object {
      "payload": Object {
        "exp": 1393286893,
        "foo": "bar",
        "iat": 1393268893,
      },
      "signature": "4-iaDojEVl0pJQMjrbM1EzUIfAZgsbK_kgnVyVxFSVo",
    }
  `);
});

test("jwt.decode(token, { signature: false })", () => {
  const token = tokens[0];
  const result = jwt.decode(token, { signature: false });

  expect(result).toMatchInlineSnapshot(`
    Object {
      "header": Object {
        "alg": "HS256",
        "typ": "JWT",
      },
      "payload": Object {
        "exp": 1393286893,
        "foo": "bar",
        "iat": 1393268893,
      },
    }
  `);
});

test("jwt.decode(token, { payload: false, signature: false })", () => {
  const token = tokens[0];
  const result = jwt.decode(token, { payload: false, signature: false });

  expect(result).toMatchInlineSnapshot(`
    Object {
      "header": Object {
        "alg": "HS256",
        "typ": "JWT",
      },
    }
  `);
});

test("jwt.decode(token, { header: false, signature: false })", () => {
  const token = tokens[0];
  const result = jwt.decode(token, { header: false, signature: false });

  expect(result).toMatchInlineSnapshot(`
    Object {
      "payload": Object {
        "exp": 1393286893,
        "foo": "bar",
        "iat": 1393268893,
      },
    }
  `);
});

test("jwt.decode(token, { header: false, payload: false })", () => {
  const token = tokens[0];
  const result = jwt.decode(token, { header: false, payload: false });

  expect(result).toMatchInlineSnapshot(`
    Object {
      "signature": "4-iaDojEVl0pJQMjrbM1EzUIfAZgsbK_kgnVyVxFSVo",
    }
  `);
});

test("jwt.decode(unicodeToken, { header: false, signature: false })", () => {
  const unicodeToken = tokens[1];
  const result = jwt.decode(unicodeToken, { header: false, signature: false });

  expect(result).toMatchInlineSnapshot(`
    Object {
      "payload": Object {
        "iat": 1425644966,
        "name": "José",
      },
    }
  `);
});

test("jwt.decode(binaryToken, { header: false, signature: false })", () => {
  const binaryToken = tokens[2];
  const result = jwt.decode(binaryToken, { header: false, signature: false });

  expect(result).toMatchInlineSnapshot(`
    Object {
      "payload": Object {
        "iat": 1425644966,
        "name": "Jos�",
      },
    }
  `);
});
