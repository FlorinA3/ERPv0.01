const { z } = require('zod');

const roleEnum = z.enum(['admin', 'sales', 'warehouse', 'production', 'readonly']);
const orderStatusEnum = z.enum([
  'draft',
  'confirmed',
  'in_production',
  'ready_to_ship',
  'shipped',
  'invoiced',
  'closed',
  'cancelled',
]);
const documentStatusEnum = z.enum(['draft', 'posted', 'paid', 'cancelled']);
const documentTypeEnum = z.enum(['delivery_note', 'invoice', 'credit_note']);
const productTypeEnum = z.enum([
  'finished',
  'device',
  'consumable',
  'part',
  'component',
  'service',
]);
const lifecycleStatusEnum = z.enum(['phaseIn', 'active', 'phaseOut', 'obsolete']);

const loginSchema = z.object({
  username: z.string().trim().min(1, 'username is required'),
  password: z.string().min(1, 'password is required'),
});

const userCreateSchema = z.object({
  username: z.string().trim().min(3).max(64).toLowerCase(),
  password: z.string().min(8, 'password must be at least 8 characters'),
  name: z.string().trim().min(1),
  email: z.string().email().optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
  role: roleEnum,
  is_active: z.boolean().optional().default(true),
});

const userUpdateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    email: z.string().email().optional(),
    role: roleEnum.optional(),
    is_active: z.boolean().optional(),
    password: z.string().min(8).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined ||
      data.role !== undefined ||
      data.is_active !== undefined ||
      data.password !== undefined,
    { message: 'At least one field must be provided' }
  );

const customerSchema = z.object({
  internal_id: z.string().trim().optional(),
  company_name: z.string().trim().min(1, 'company_name is required'),
  status: z.enum(['active', 'inactive']).default('active'),
  vat_number: z.string().trim().optional(),
  payment_terms: z.string().trim().optional(),
  delivery_terms: z.string().trim().optional(),
  price_segment: z.string().trim().optional(),
  default_currency: z.string().trim().length(3).default('EUR'),
  default_language: z.string().trim().optional(),
});

const customerUpdateSchema = customerSchema
  .partial()
  .extend({
    row_version: z.coerce.number().int().min(1),
  })
  .refine(
    (data) => Object.keys(data).some((k) => k !== 'row_version'),
    { message: 'At least one field must be provided' }
  );

const money = (min = 0) => z.coerce.number().min(min);
const quantity = (min = 0) => z.coerce.number().min(min);
const dateLike = () => z.union([z.coerce.date(), z.string().trim().min(1)]).optional();

const orderCreateSchema = z.object({
  customer_id: z.coerce.number().int(),
  price_list_id: z.coerce.number().int().optional(),
  order_date: dateLike(),
  planned_delivery: dateLike(),
  currency: z.string().trim().length(3).optional().default('EUR'),
  payment_terms: z.string().trim().optional(),
  delivery_terms: z.string().trim().optional(),
  subtotal_net: money(0).optional(),
  vat_amount: money(0).optional(),
  total_gross: money(0).optional(),
});

const orderUpdateSchema = orderCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

const orderTransitionSchema = z.object({
  action: z.enum([
    'confirm',
    'start_production',
    'ready_to_ship',
    'ship',
    'invoice',
    'close',
    'cancel',
  ]),
});

const documentCreateSchema = z.object({
  type: documentTypeEnum,
  customer_id: z.coerce.number().int(),
  order_id: z.coerce.number().int().optional(),
  related_document_id: z.coerce.number().int().optional(),
  billing_address_id: z.coerce.number().int().optional(),
  shipping_address_id: z.coerce.number().int().optional(),
  currency: z.string().trim().length(3).optional().default('EUR'),
  payment_terms: z.string().trim().optional(),
  delivery_terms: z.string().trim().optional(),
  net_total: money(0).optional(),
  vat_total: money(0).optional(),
  gross_total: money(0).optional(),
  vat_summary: z.any().optional(),
  due_date: dateLike(),
  issued_at: dateLike(),
});

const documentUpdateSchema = documentCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

const documentPostSchema = z.object({
  doc_number: z.string().trim().optional(),
  posted_at: dateLike(),
});

const documentPaySchema = z.object({
  paid_at: dateLike(),
});

const documentReprintSchema = z.object({
  legal_template_version: z.string().trim().optional(),
  printed_at: dateLike(),
});

const shipmentLineSchema = z.object({
  product_id: z.coerce.number().int(),
  quantity: quantity(0.0001), // strictly positive
  unit_cost: money(0).optional(),
  currency: z.string().trim().length(3).default('EUR'),
  lot_code: z.string().trim().optional(),
  location: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const shipmentCreateSchema = z.object({
  document_id: z.coerce.number().int(),
  order_id: z.coerce.number().int().optional(),
  lines: z.array(shipmentLineSchema).min(1),
});

const productSchema = z.object({
  sku: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  type: productTypeEnum.default('finished'),
  unit: z.string().trim().min(1).default('Stk'),
  allow_decimal_qty: z.boolean().optional().default(false),
  avg_purchase_price: money(0).optional(),
  dealer_price: money(0).optional(),
  end_customer_price: money(0).optional(),
  currency: z.string().trim().length(3).default('EUR'),
  vat_rate: z.coerce.number().min(0).max(100).default(20),
  lifecycle_status: lifecycleStatusEnum.default('active'),
  min_stock: quantity(0).default(0),
});

const productUpdateSchema = productSchema
  .partial()
  .extend({
    row_version: z.coerce.number().int().min(1),
  })
  .refine(
    (data) => Object.keys(data).some((k) => k !== 'row_version'),
    { message: 'At least one field must be provided' }
  );

module.exports = {
  loginSchema,
  userCreateSchema,
  userUpdateSchema,
  customerSchema,
  customerUpdateSchema,
  productSchema,
  productUpdateSchema,
  roleEnum,
  orderStatusEnum,
  documentStatusEnum,
  documentTypeEnum,
  productTypeEnum,
  lifecycleStatusEnum,
  orderCreateSchema,
  orderUpdateSchema,
  orderTransitionSchema,
  documentCreateSchema,
  documentUpdateSchema,
  documentPostSchema,
  documentPaySchema,
  documentReprintSchema,
  shipmentCreateSchema,
};
