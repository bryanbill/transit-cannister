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

type UserLocation = Record<{
  id: string;
  user_id: string;
  location: Record<{
    lat: number;
    lng: number;
  }>;
  created_at: nat64;
  updated_at: Opt<nat64>;
}>;

type UserLocationPayload = Record<{
  user_id: string;
  location: Record<{
    lat: number;
    lng: number;
  }>;
}>;

type Order = Record<{
  id: string;
  description: string;
  weight: number;
  sender: string;
  receiver: string;
  sender_location: Record<{
    lat: number;
    lng: number;
  }>;
  receiver_location: Record<{
    lat: number;
    lng: number;
  }>;
  status: string;
  initial_amount: number;
  created_at: nat64;
  updated_at: Opt<nat64>;
}>;

type OrderPayload = Record<{
  description: string;
  weight: number;
  sender: string;
  receiver: string;
  status: string;
}>;

type Payment = Record<{
  id: string;
  order_id: string;
  amount: number;
  status: string;
  created_at: nat64;
  updated_at: Opt<nat64>;
}>;

type PaymentPayload = Record<{
  order_id: string;
  amount: number;
  status: string;
}>;

type Shipment = Record<{
  id: string;
  order_id: string;
  driver_id: string;
  last_location: Record<{
    lat: number;
    lng: number;
  }>;
  created_at: nat64;
  updated_at: Opt<nat64>;
}>;

type ShipmentPayload = Record<{
  order_id: string;
  driver_id: string;
  last_location: Record<{
    lat: number;
    lng: number;
  }>;
}>;

// Initialize storage for each entity
const userStorage = new StableBTreeMap<string, User>(0, 44, 1024);
const userLocationStorage = new StableBTreeMap<string, UserLocation>(
  1,
  88,
  2048
);
const orderStorage = new StableBTreeMap<string, Order>(2, 88, 2048);
const paymentStorage = new StableBTreeMap<string, Payment>(3, 88, 2048);
const shipmentStorage = new StableBTreeMap<string, Shipment>(4, 88, 2048);

// User

/**
 * @name getUsers
 * @description Get all users from user storage
 * @returns {Result<Vec<User>, string>}
 */
$query;
export function getUsers(): Result<Vec<User>, string> {
  try {
    return Result.Ok(userStorage.values());
  } catch (error) {
    return Result.Err(`An error occurred: ${error}`);
  }
}

/**
 * @name getUser
 * @description Get user by id from user storage
 * @param {string} id
 * @returns {Result<User, string>}
 */
$query;
export function getUser(id: string): Result<User, string> {
  if (!id) return Result.Err<User, string>(`Invalid id`);
  return match(userStorage.get(id), {
    Some: (user) => Result.Ok<User, string>(user),
    None: () => Result.Err<User, string>(`User of id:${id} not found`),
  });
}

/**
 * @name createUser
 * @description Create user and store it in user storage
 * @param {UserPayload} payload
 * @returns {Result<User, string>}
 */
$update;
export function createUser(payload: UserPayload): Result<User, string> {
  //   if (!payload.username || !payload.type) {
  //     return Result.Err("Invalid payload: missing username or type");
  //   }

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
  return match(userStorage.remove(id), {
    Some: (user) => Result.Ok<User, string>(user),
    None: () => Result.Err<User, string>(`User of id:${id} not found`),
  });
}

// User Location

/**
 * @name getUserLocation
 * @description Get user location by user id from user location storage
 * @param {string} userid
 * @returns {Result<UserLocation, string>}
 */
$query;
export function getUserLocation(userid: string): Result<UserLocation, string> {
  if (!userid) return Result.Err<UserLocation, string>(`Invalid user id`);
  return match(userLocationStorage.get(userid), {
    Some: (userLocation) => Result.Ok<UserLocation, string>(userLocation),
    None: () =>
      Result.Err<UserLocation, string>(
        `User location of id:${userid} not found`
      ),
  });
}

/**
 * @name createUserLocation
 * @description Create user location and store it in user location storage
 * @param {UserLocationPayload} payload
 * @returns {Result<UserLocation, string>}
 */
$update;
export function createUserLocation(
  payload: UserLocationPayload
): Result<UserLocation, string> {
  if (!payload.user_id || !payload.location) {
    return Result.Err("Invalid payload");
  }


  try {
    const userLocation: UserLocation = {
      id: uuidv4(),
      user_id: payload.user_id,
      location: payload.location,
      created_at: ic.time(),
      updated_at: Opt.None,
    };

    userLocationStorage.insert(userLocation.user_id, userLocation);
    return Result.Ok(userLocation);
  } catch (error) {
    return Result.Err(`Error creating user location: ${error}`);
  }
}

/**
 * @name updateUserLocation
 * @description Update user location by user id from user location storage
 * @param {string} userid
 * @param {UserLocationPayload} payload
 * @returns {Result<UserLocation, string>}
 */
$update;
export function updateUserLocation(
  userid: string,
  payload: UserLocationPayload
): Result<UserLocation, string> {
  if (!userid) return Result.Err<UserLocation, string>(`Invalid user id`);
  if (
    !payload ||
    !payload.location ||
    typeof payload.location.lat !== "number" ||
    typeof payload.location.lng !== "number"
  ) {
    return Result.Err<UserLocation, string>(`Invalid payload`);
  }
  return match(userLocationStorage.get(userid), {
    Some: (userLocation) => {
      const updatedUserLocation = {
        ...userLocation,
        location: payload.location,
        updated_at: Opt.Some(ic.time()),
      };
      try {
        userLocationStorage.insert(userid, updatedUserLocation);
        return Result.Ok<UserLocation, string>(updatedUserLocation);
      } catch (error) {
        return Result.Err<UserLocation, string>(
          `Failed to update user location: ${error}`
        );
      }
    },
    None: () =>
      Result.Err<UserLocation, string>(
        `User location of id:${userid} not found`
      ),
  });
}

// Order

/**
 * @name getOrders
 * @description Get all orders from order storage
 * @returns {Result<Vec<Order>, string>}
 */
$query;
export function getOrders(): Result<Vec<Order>, string> {
  try {
    return Result.Ok(orderStorage.values());
  } catch (error) {
    return Result.Err(`Error retrieving orders: ${error}`);
  }
}

/**
 * @name getOrder
 * @description Get order by id from order storage
 * @param {string} id
 * @returns {Result<Order, string>}
 */
$query;
export function getOrder(id: string): Result<Order, string> {
  if (!id) return Result.Err<Order, string>(`Invalid id`);
  return match(orderStorage.get(id), {
    Some: (order) => Result.Ok<Order, string>(order),
    None: () => Result.Err<Order, string>(`Order of id:${id} not found`),
  });
}

/**
 * @name createOrder
 * @description Create order and store it in order storage
 * @param {OrderPayload} payload
 * @returns {Result<Order, string>}
 */
$update;
export function createOrder(payload: OrderPayload): Result<Order, string> {
  const senderId = payload.sender;
  const receiverId = payload.receiver;

  // Get sender and receiver locations
  let senderLocation = match(userLocationStorage.get(senderId), {
    Some: (location) => location.location,
    None: () =>
      Result.Err<Order, string>(`Sender location of id:${senderId} not found`),
  });

  let receiverLocation = match(userLocationStorage.get(receiverId), {
    Some: (location) => location.location,
    None: () =>
      Result.Err<Order, string>(
        `Receiver location of id:${receiverId} not found`
      ),
  });

  senderLocation = senderLocation as { lat: number; lng: number };
  receiverLocation = receiverLocation as { lat: number; lng: number };

  // Calculate distance between sender and receiver
  const distance = Math.sqrt(
    Math.pow(senderLocation.lat - receiverLocation.lat, 2) +
    Math.pow(senderLocation.lng - receiverLocation.lng, 2)
  );

  // Calculate initial amount based on distance
  let initialAmount = 0;
  if (distance < 10) {
    initialAmount = distance * 30 * payload.weight;
  } else if (distance < 50) {
    initialAmount = distance * 25 * payload.weight;
  } else {
    initialAmount = distance * 20 * payload.weight;
  }

  const order: Order = {
    id: uuidv4(),
    description: payload.description,
    weight: payload.weight,
    sender: payload.sender,
    receiver: payload.receiver,
    sender_location: senderLocation,
    receiver_location: receiverLocation,
    status: payload.status,
    initial_amount: initialAmount,
    created_at: ic.time(),
    updated_at: Opt.None,
  };
  orderStorage.insert(order.id, order);
  return Result.Ok(order);
}

/**
 * @name updateOrder
 * @description Update order by id from order storage
 * @param {string} id
 * @param {OrderPayload} payload
 * @returns {Result<Order, string>}
 */
$update;
export function updateOrder(
  id: string,
  payload: OrderPayload
): Result<Order, string> {
  if (!id) return Result.Err<Order, string>(`Invalid id`);

  if (
    !payload.description ||
    !payload.weight ||
    !payload.sender ||
    !payload.receiver ||
    !payload.status
  ) {
    return Result.Err<Order, string>("Invalid payload");
  }
  return match(orderStorage.get(id), {
    Some: (order) => {
      const updatedOrder = {
        ...order,
        description: payload.description,
        weight: payload.weight,
        sender: payload.sender,
        receiver: payload.receiver,
        status: payload.status,
        updated_at: Opt.Some(ic.time()),
      };
      orderStorage.insert(id, updatedOrder);
      return Result.Ok<Order, string>(updatedOrder);
    },
    None: () => Result.Err<Order, string>(`Order of id:${id} not found`),
  });
}

/**
 * @name deleteOrder
 * @description Delete order by id from order storage
 * @param {string} id
 * @returns {Result<Order, string>}
 */
$update;
export function deleteOrder(id: string): Result<Order, string> {
  if (!id) return Result.Err<Order, string>(`Invalid id`);
  return match(orderStorage.remove(id), {
    Some: (order) => Result.Ok<Order, string>(order),
    None: () => Result.Err<Order, string>(`Order of id:${id} not found`),
  });
}

// Payment

/**
 * @name getPayments
 * @description Get all payments from payment storage
 * @returns {Result<Vec<Payment>, string>}
 */
$query;
export function getPayments(): Result<Vec<Payment>, string> {
  try {
    return Result.Ok(paymentStorage.values());
  } catch (error) {
    return Result.Err(`Failed to fetch payments: ${error}`);
  }
}

/**
 * @name getPayment
 * @description Get payment by id from payment storage
 * @param {string} id
 * @returns {Result<Payment, string>}
 */
$query;
export function getPayment(id: string): Result<Payment, string> {
  if (!id) return Result.Err<Payment, string>(`Invalid id`);
  return match(paymentStorage.get(id), {
    Some: (payment) => Result.Ok<Payment, string>(payment),
    None: () => Result.Err<Payment, string>(`Payment of id:${id} not found`),
  });
}

/**
 * @name createPayment
 * @description Create payment and store it in payment storage
 * @param {PaymentPayload} payload
 * @returns {Result<Payment, string>}
 */
$update;
export function createPayment(
  payload: PaymentPayload
): Result<Payment, string> {
  // Validate payload
  if (!payload.order_id || typeof payload.order_id !== "string") {
    return Result.Err<Payment, string>("Invalid order_id");
  }
  if (
    !payload.amount ||
    typeof payload.amount !== "number" ||
    payload.amount <= 0
  ) {
    return Result.Err<Payment, string>("Invalid amount");
  }
  if (!payload.status || typeof payload.status !== "string") {
    return Result.Err<Payment, string>("Invalid status");
  }

  const payment: Payment = {
    id: uuidv4(),
    order_id: payload.order_id,
    amount: payload.amount,
    status: payload.status,
    created_at: ic.time(),
    updated_at: Opt.None,
  };
  paymentStorage.insert(payment.id, payment);

  // Update order status
  const order = match(orderStorage.get(payload.order_id), {
    Some: (order) => order,
    None: () =>
      Result.Err<Order, string>(`Order of id:${payload.order_id} not found`),
  });

  return Result.Ok(payment);
}

// Shipment

/**
 * @name getShipments
 * @description Get all shipments from shipment storage
 * @returns {Result<Vec<Shipment>, string>}
 */

$query;
export function getShipments(): Result<Vec<Shipment>, string> {
  try {
    return Result.Ok(shipmentStorage.values());
  } catch (error) {
    return Result.Err(`Failed to get shipments: ${error}`);
  }
}

/**
 * @name getShipment
 * @description Get shipment by id from shipment storage
 * @param {string} id
 * @returns {Result<Shipment, string>}
 */
$query;
export function getShipment(id: string): Result<Shipment, string> {
  if (!id) return Result.Err<Shipment, string>(`Invalid id`);
  return match(shipmentStorage.get(id), {
    Some: (shipment) => Result.Ok<Shipment, string>(shipment),
    None: () => Result.Err<Shipment, string>(`Shipment of id:${id} not found`),
  });
}

/**
 * @name createShipment
 * @description Create shipment and store it in shipment storage
 * @param {ShipmentPayload} payload
 * @returns {Result<Shipment, string>}
 */
$update;
export function createShipment(
  payload: ShipmentPayload
): Result<Shipment, string> {
  if (!payload.order_id || !payload.driver_id || !payload.last_location) {
    return Result.Err<Shipment, string>("Invalid payload");
  }
  // Get Order
  const order = match(orderStorage.get(payload.order_id), {
    Some: (order) => order,
    None: () =>
      Result.Err<Order, string>(`Order of id:${payload.order_id} not found`),
  });

  const shipment: Shipment = {
    id: uuidv4(),
    driver_id: payload.driver_id,
    order_id: payload.order_id,
    last_location: payload.last_location,
    created_at: ic.time(),
    updated_at: Opt.None,
  };
  shipmentStorage.insert(shipment.id, shipment);

  const updatedOrder = {
    ...(order as Order),
    status: "in_transit",
    updated_at: Opt.Some(ic.time()),
  };
  orderStorage.insert(payload.order_id, updatedOrder);

  return Result.Ok(shipment);
}

/**
 * @name updateShipment
 * @description Update shipment by id from shipment storage
 * @param {string} id
 * @param {ShipmentPayload} payload
 * @returns {Result<Shipment, string>}
 */
$update;
export function updateShipment(
  id: string,
  payload: ShipmentPayload
): Result<Shipment, string> {
  if (!id) return Result.Err<Shipment, string>(`Invalid id`);
  return match(shipmentStorage.get(id), {
    Some: (shipment) => {
      const updatedShipment = {
        ...shipment,
        last_location: payload.last_location,
        updated_at: Opt.Some(ic.time()),
      };
      shipmentStorage.insert(id, updatedShipment);
      return Result.Ok<Shipment, string>(updatedShipment);
    },
    None: () => Result.Err<Shipment, string>(`Shipment of id:${id} not found`),
  });
}

globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let arr = new Uint8Array(32);

    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
};
