package com.javaweb.utils;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.Locale;
import java.util.Map;

public final class MapUtil {

    private MapUtil() {
    }

    public static <T> T getObject(Map<String, ?> params, String key, Class<T> targetType) {
        if (params == null || key == null || targetType == null) {
            return null;
        }

        Object value = params.get(key);
        if (value == null) {
            return null;
        }

        String text = value.toString().trim();
        if (text.isEmpty()) {
            return null;
        }

        try {
            return convert(value, text, targetType);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(
                    "Invalid value for parameter '" + key + "': " + value, ex);
        }
    }

    private static <T> T convert(Object value, String text, Class<T> targetType) {
        Class<?> boxedType = boxedType(targetType);
        if (boxedType.isInstance(value)) {
            return cast(value);
        }
        if (boxedType == String.class) {
            return cast(text);
        }
        if (boxedType == Integer.class) {
            return cast(Integer.valueOf(text));
        }
        if (boxedType == Long.class) {
            return cast(Long.valueOf(text));
        }
        if (boxedType == Double.class) {
            return cast(Double.valueOf(text));
        }
        if (boxedType == Float.class) {
            return cast(Float.valueOf(text));
        }
        if (boxedType == Short.class) {
            return cast(Short.valueOf(text));
        }
        if (boxedType == Byte.class) {
            return cast(Byte.valueOf(text));
        }
        if (boxedType == BigDecimal.class) {
            return cast(new BigDecimal(text));
        }
        if (boxedType == BigInteger.class) {
            return cast(new BigInteger(text));
        }
        if (boxedType == Boolean.class) {
            if (!text.equalsIgnoreCase("true") && !text.equalsIgnoreCase("false")) {
                throw new IllegalArgumentException("Boolean value must be true or false");
            }
            return cast(Boolean.valueOf(text));
        }
        if (boxedType.isEnum()) {
            return cast(toEnum(text, boxedType));
        }

        throw new IllegalArgumentException(
                "Unsupported parameter type: " + targetType.getSimpleName());
    }

    private static Object toEnum(String value, Class<?> enumType) {
        @SuppressWarnings({"rawtypes", "unchecked"})
        Object enumValue = Enum.valueOf(
                (Class<? extends Enum>) enumType.asSubclass(Enum.class),
                value.toUpperCase(Locale.ROOT)
        );
        return enumValue;
    }

    private static Class<?> boxedType(Class<?> type) {
        if (!type.isPrimitive()) {
            return type;
        }
        if (type == int.class) return Integer.class;
        if (type == long.class) return Long.class;
        if (type == double.class) return Double.class;
        if (type == float.class) return Float.class;
        if (type == short.class) return Short.class;
        if (type == byte.class) return Byte.class;
        if (type == boolean.class) return Boolean.class;
        if (type == char.class) return Character.class;
        return type;
    }

    @SuppressWarnings("unchecked")
    private static <T> T cast(Object value) {
        return (T) value;
    }
}
