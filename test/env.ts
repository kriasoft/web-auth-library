/* SPDX-FileCopyrightText: 2022-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import { cleanEnv, str } from "envalid";

export default cleanEnv(process.env, {
  GOOGLE_CLOUD_CREDENTIALS: str(),
});
