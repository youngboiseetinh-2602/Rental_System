package com.javaweb.model.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CursorPageResponse<T> {
    private List<T> content;
    private String nextCursor;
    private boolean hasNext;
}
