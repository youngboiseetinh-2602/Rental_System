import {
    mapRentalProperty,
    normalizeRentalSearchParams,
    searchRentalProperties,
} from './rentalService';

const originalFetch = global.fetch;

describe('rentalService', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    it('gọi API public không có query khi map filter rỗng', async () => {
        const page = {
            content: [],
            totalElements: 0,
        };
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => page,
        });

        await expect(searchRentalProperties({})).resolves.toBe(page);
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:8080/api/rental-properties',
            {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    Accept: 'application/json',
                },
            },
        );
    });

    it('chỉ đưa filter có giá trị vào query map', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ content: [], totalElements: 0 }),
        });

        await searchRentalProperties({
            description: '  nội thất ',
            city: 'Hà Nội',
            ward: '',
            rentalType: 'studio',
            minPrice: '2000000',
            maxPrice: null,
            unknown: 'ignored',
        });

        const requestUrl = new URL(global.fetch.mock.calls[0][0]);
        expect(Object.fromEntries(requestUrl.searchParams)).toEqual({
            rentalType: 'studio',
            description: 'nội thất',
            city: 'Hà Nội',
            minPrice: '2000000',
        });
        expect(normalizeRentalSearchParams({ city: '  ', street: null }))
            .toEqual({});
    });

    it('coi HTTP 404 của API search là danh sách rỗng', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 404,
        });

        await expect(searchRentalProperties({ city: 'Không tồn tại' }))
            .resolves.toMatchObject({
                content: [],
                totalElements: 0,
            });
    });

    it('map đúng DTO Rental của backend sang card giao diện', () => {
        expect(mapRentalProperty({
            id: 7,
            name: 'Nhà trọ A',
            description: 'Gần trường đại học',
            city: 'Hà Nội',
            ward: 'Cầu Giấy',
            street: 'Trần Thái Tông',
            houseNumber: '12',
            ownerName: 'Nguyễn Văn A',
            ownerPhoneNumber: '0912345678',
            rentalTypeName: 'phòng trọ',
        })).toEqual({
            id: 7,
            title: 'Nhà trọ A',
            description: 'Gần trường đại học',
            location: '12, Trần Thái Tông, Cầu Giấy, Hà Nội',
            ownerName: 'Nguyễn Văn A',
            ownerPhoneNumber: '0912345678',
            badges: ['phòng trọ'],
        });
    });
});
