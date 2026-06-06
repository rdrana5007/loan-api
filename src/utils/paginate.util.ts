import { Model, FindOptions, Op, Sequelize, WhereOptions, ModelStatic, IncludeOptions } from 'sequelize';

interface PaginateParams<T extends Model> {
    model: ModelStatic<T>;
    page?: number;
    pageSize?: number;
    whereClause?: WhereOptions<T>;
    searchQuery?: string;
    searchFields?: string[];
    sortField?: string;
    sortOrder?: 'ASC' | 'DESC';
    options?: FindOptions<T>;
};

interface PageInfo {
    current_page: number;
    page_size: number;
    total_pages: number;
    total_count: number;
};

interface PaginateResult<T> {
    page_info: PageInfo;
    items: T[];
};

export const paginate = async <T extends Model>({
    model,
    page = 1,
    pageSize,
    whereClause = {},
    searchQuery = '',
    searchFields = [],
    sortField = 'createdAt',
    sortOrder = 'DESC',
    options = {}
}: PaginateParams<T>): Promise<PaginateResult<T>> => {
    try {
        const sanitizedSortOrder = sortOrder?.trim()?.toUpperCase() as 'ASC' | 'DESC';
        if (!['ASC', 'DESC'].includes(sanitizedSortOrder)) {
            throw new Error(`Invalid sortOrder: '${ sortOrder }'. Use 'ASC' or 'DESC'.`);
        }

        // ✅ Normalize include
        const include = (
            Array.isArray(options.include)
                ? options.include
                : options.include
                    ? [options.include]
                    : []
        ) as IncludeOptions[];

        // 🔍 Universal Search
        if (searchQuery && searchFields.length > 0) {
            const searchConditions = searchFields.map((field) => {
                if (field.includes('.')) {
                    return { [`$${ field }$`]: { [Op.like]: `%${ searchQuery }%` } };
                } else {
                    return { [field]: { [Op.like]: `%${ searchQuery }%` } };
                }
            });

            whereClause = {
                ...whereClause,
                [Op.or]: searchConditions,
            } as unknown as WhereOptions<T>;
        }

        // 🧾 Sorting logic
        let order: any[] = [];
        if (sortField.includes('.')) {
            const [association, assocField] = sortField.split('.');
            order = [[Sequelize.literal(`\`${ association }\`.\`${ assocField }\``), sanitizedSortOrder]];
        } else {
            order = [[sortField, sanitizedSortOrder]];
        }

        // ✅ Query Options
        const queryOptions: FindOptions & { distinct?: boolean } = {
            where: whereClause,
            order,
            include,
            distinct: true,
            subQuery: false,
            ...options
        };

        // ⚡ No pagination
        if (!page || !pageSize) {
            const items = await model.findAll(queryOptions);
            return {
                page_info: {
                    current_page: 1,
                    page_size: items.length,
                    total_pages: 1,
                    total_count: items.length
                },
                items
            };
        }

        const offset = (page - 1) * pageSize;

        const totalCount = await model.count({
            where: whereClause,
            include,
            distinct: true,
            paranoid: options.paranoid ?? true
        });

        const totalPages = Math.ceil(totalCount / pageSize);

        const items = await model.findAll({
            ...queryOptions,
            offset,
            limit: pageSize
        });

        return {
            page_info: {
                current_page: page,
                page_size: pageSize,
                total_pages: totalPages,
                total_count: totalCount
            },
            items
        };
    } catch (error) {
        console.error('Pagination error:', error);
        throw error;
    }
};

export default paginate;