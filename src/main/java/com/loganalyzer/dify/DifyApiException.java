package com.loganalyzer.dify;

/**
 * Dify Workflow API 호출 실패 시 발생 (재시도 소진, 응답 오류/스키마 불일치 포함).
 */
public class DifyApiException extends RuntimeException {

    public DifyApiException(String message) {
        super(message);
    }

    public DifyApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
