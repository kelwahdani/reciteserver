// // Query Builder in Prisma

// import httpStatus from 'http-status';
// import AppError from '../errors/AppError';

// class QueryBuilder {
//   private model: any;
//   private query: Record<string, unknown>;
//   private prismaQuery: any = {}; // Define as any for flexibility

//   constructor(model: any, query: Record<string, unknown>) {
//     this.model = model;
//     this.query = query;
//   }
// 
//   // Search
//   search(searchableFields: string[]) {
//     const searchTerm = this.query.searchTerm as string;
//     if (searchTerm) {
//       this.prismaQuery.where = {
//         ...this.prismaQuery.where,
//         OR: searchableFields.map(field => ({
//           [field]: { contains: searchTerm, mode: 'insensitive' },
//         })),
//       };
//     }
//     return this;
//   }

//   // Filter
//   filter() {
//     const queryObj = { ...this.query };
//     const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
//     excludeFields.forEach(field => delete queryObj[field]);

//     const formattedFilters: Record<string, any> = {};
//     for (const [key, value] of Object.entries(queryObj)) {
//       if (typeof value === 'object' && value !== null) {
//         let operatorFilter: Record<string, number> = {};
//         for (const [operator, val] of Object.entries(value)) {
//           const numericValue = parseFloat(val);
//           if (isNaN(numericValue)) {
//             throw new AppError(
//               httpStatus.BAD_REQUEST,
//               `The value field in the ${operator} should be a number`,
//             );
//           }
//           operatorFilter[operator] = numericValue;
//         }
//         formattedFilters[key] = operatorFilter;
//       } else {
//         formattedFilters[key] = value;
//       }
//     }

//     this.prismaQuery.where = {
//       ...this.prismaQuery.where,
//       ...formattedFilters,
//     };

//     return this;
//   }

//   // Sorting
//   sort() {
//     const sort = (this.query.sort as string)?.split(',') || ['-createdAt'];
//     const orderBy = sort.map(field => {
//       if (field.startsWith('-')) {
//         return { [field.slice(1)]: 'desc' };
//       }
//       return { [field]: 'asc' };
//     });

//     this.prismaQuery.orderBy = orderBy;
//     return this;
//   }

//   // Pagination
//   paginate() {
//     const page = Number(this.query.page) || 1;
//     const limit = Number(this.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     this.prismaQuery.skip = skip;
//     this.prismaQuery.take = limit;

//     return this;
//   }

//   // Fields Selection
//   fields() {
//     const fields = (this.query.fields as string)?.split(',') || [];
//     if (fields.length > 0) {
//       this.prismaQuery.select = fields.reduce(
//         (acc: Record<string, boolean>, field) => {
//           if (field.startsWith('-')) {
//             acc[field.slice(1)] = false;
//           } else {
//             acc[field] = true;
//           }
//           return acc;
//         },
//         {},
//       );
//     }
//     return this;
//   }


//   // Execute Query
//   async execute() {
//     return this.model.findMany(this.prismaQuery);
//   }

//   // Count Total
//   async countTotal() {
//     const total = await this.model.count({ where: this.prismaQuery.where });
//     const page = Number(this.query.page) || 1;
//     const limit = Number(this.query.limit) || 10;
//     const totalPage = Math.ceil(total / limit);

//     return {
//       page,
//       limit,
//       total,
//       totalPage,
//     };
//   }
// }

// export default QueryBuilder;






import httpStatus from 'http-status';
import AppError from '../errors/AppError';
 
interface QueryBuilderOptions {
  include?: Record<string, any>;
}
 
class QueryBuilder {
  private model: any;
  private query: Record<string, unknown>;
  private prismaQuery: any = {};
 
  constructor(model: any, query: Record<string, unknown>, options?: QueryBuilderOptions|any) {
    this.model = model;
    this.query = query;
    if (options?.include) {
      this.prismaQuery.include = options.include;
    }
     if (options?.select) {
      this.prismaQuery.select = options.select;
    }
  }
 
  // Search
  search(searchableFields: string[]) {
    const searchTerm = this.query.searchTerm as string;
    if (searchTerm) {
      this.prismaQuery.where = {
        ...this.prismaQuery.where,
        OR: searchableFields.map(field => ({
          [field]: { contains: searchTerm, mode: 'insensitive' },
        })),
      };
    }
    return this;
  }
 
  // Filter
  filter() {
    const queryObj = { ...this.query };
    const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
    excludeFields.forEach(field => delete queryObj[field]);
 
    const formattedFilters: Record<string, any> = {};
    for (const [key, value] of Object.entries(queryObj)) {
      if (typeof value === 'object' && value !== null) {
        let operatorFilter: Record<string, number> = {};
        for (const [operator, val] of Object.entries(value)) {
          const numericValue = parseFloat(val);
          if (isNaN(numericValue)) {
            throw new AppError(
              httpStatus.BAD_REQUEST,
              `The value field in the ${operator} should be a number`,
            );
          }
          operatorFilter[operator] = numericValue;
        }
        formattedFilters[key] = operatorFilter;
      } else {
        formattedFilters[key] = value;
      }
    }
 
    this.prismaQuery.where = {
      ...this.prismaQuery.where,
      ...formattedFilters,
    };
 
    return this;
  }
 
  // Sorting
  sort() {
    const sort = (this.query.sort as string)?.split(',') || ['-createdAt'];
    const orderBy = sort.map(field => {
      if (field.startsWith('-')) {
        return { [field.slice(1)]: 'desc' };
      }
      return { [field]: 'asc' };
    });
 
    this.prismaQuery.orderBy = orderBy;
    return this;
  }
 
  // Pagination
  paginate() {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;
 
    this.prismaQuery.skip = skip;
    this.prismaQuery.take = limit;
 
    return this;
  }
 
  // Fields Selection
  fields() {
    const fields = (this.query.fields as string)?.split(',') || [];
    if (fields.length > 0) {
      this.prismaQuery.select = fields.reduce(
        (acc: Record<string, boolean>, field) => {
          if (field.startsWith('-')) {
            acc[field.slice(1)] = false;
          } else {
            acc[field] = true;
          }
          return acc;
        },
        {},
      );
    }
    return this;
  }
 
  // Execute Query
  async execute() {
    return this.model.findMany(this.prismaQuery);
  }
 
  // Count Total
  async countTotal() {
    const total = await this.model.count({ where: this.prismaQuery.where });
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalPage = Math.ceil(total / limit);
 
    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}
 
export default QueryBuilder;
