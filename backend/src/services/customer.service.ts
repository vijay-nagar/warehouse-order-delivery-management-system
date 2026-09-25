import type {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "../domain/customers/customer.types.js";
import { CustomerRepository } from "../repositories/customer.repository.js";
import type {
  PaginationRequest,
  PaginationResult,
} from "../shared/pagination/pagination.types.js";

export class CustomerService {
  constructor(
    private readonly customerRepository: CustomerRepository,
  ) {}

  async createCustomer(
    input: CreateCustomerInput,
  ): Promise<Customer> {
    const existingCustomer =
      await this.customerRepository.findByPhone(input.phone);

    if (existingCustomer) {
      throw new Error("Customer with this phone already exists");
    }

    return this.customerRepository.create(input);
  }

  async getCustomers(
    pagination: PaginationRequest,
    search?: string,
  ): Promise<PaginationResult<Customer>> {
    return this.customerRepository.findAll(pagination, search);
  }

  async getCustomerById(
    id: number,
  ): Promise<Customer | null> {
    return this.customerRepository.findById(id);
  }

  async updateCustomer(
    id: number,
    input: UpdateCustomerInput,
  ): Promise<Customer | null> {
    const existingCustomer =
      await this.customerRepository.findById(id);

    if (!existingCustomer) {
      return null;
    }

    if (
      input.phone &&
      input.phone !== existingCustomer.phone
    ) {
      const customerWithPhone =
        await this.customerRepository.findByPhone(input.phone);

      if (
        customerWithPhone &&
        customerWithPhone.id !== id
      ) {
        throw new Error(
          "Customer with this phone already exists",
        );
      }
    }

    return this.customerRepository.update(id, input);
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.customerRepository.delete(id);
  }
}
