import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
} from "azle";
import { v4 as uuidv4 } from "uuid";

type User = Record<{
  id: string;
  username: string;
  type: string;
  created_at: nat64;
  updated_at: Opt<nat64>;
}>;

type UserPayload = Record<{
  username: string;
  type: string;
}>;

// Initialize storage for users
const userStorage = new StableBTreeMap<string, User>(0, 44, 1024);

/**
 * @name createUser
 * @description Create user and store it in user storage
 * @param {UserPayload} payload
 * @returns {Result<User, string>}
 */
$update;
export function createUser(payload: UserPayload): Result<User, string> {
  if (!payload.username || !payload.type) {
    return Result.Err("Invalid payload: missing username or type");
  }

  const existingUser = userStorage
    .values()
    .find((user) => user.username === payload.username);
  if (existingUser) {
    return Result.Err("User with the same username already exists");
  }

  const user: User = {
    id: uuidv4(),
    created_at: ic.time(),
    updated_at: Opt.None,
    ...payload,
  };

  try {
    userStorage.insert(user.id, user);
    return Result.Ok(user);
  } catch (error) {
    return Result.Err("Failed to insert user into userStorage");
  }
}

/**
 * @name updateUser
 * @description Update user by id from user storage
 * @param {string} id
 * @param {UserPayload} payload
 * @returns {Result<User, string>}
 */
$update;
export function updateUser(
  id: string,
  payload: UserPayload
): Result<User, string> {
  if (!id) return Result.Err<User, string>(`Invalid id`);
  if (!payload.username || !payload.type)
    return Result.Err<User, string>(`Invalid payload`);
  return match(userStorage.get(id), {
    Some: (user) => {
      const updatedUser = {
        ...user,
        username: payload.username,
        type: payload.type,
        updated_at: Opt.Some(ic.time()),
      };
      try {
        userStorage.insert(id, updatedUser);
        return Result.Ok<User, string>(updatedUser);
      } catch (error) {
        return Result.Err<User, string>(`Error inserting user: ${error}`);
      }
    },
    None: () => Result.Err<User, string>(`User of id:${id} not found`),
  });
}

/**
 * @name deleteUser
 * @description Delete user by id from user storage
 * @param {string} id
 * @returns {Result<User, string>}
 */
$update;
export function deleteUser(id: string): Result<User, string> {
  if (!id) return Result.Err<User, string>(`Invalid id`);
  const existingUser = userStorage.get(id);
  if (!existingUser) {
    return Result.Err<User, string>(`User of id:${id} not found`);
  }
  try {
    userStorage.remove(id);
    return Result.Ok<User, string>(existingUser);
  } catch (error) {
    return Result.Err<User, string>(`Error deleting user: ${error}`);
  }
}
