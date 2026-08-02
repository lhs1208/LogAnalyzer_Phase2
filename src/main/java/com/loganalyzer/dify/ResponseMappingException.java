package com.loganalyzer.dify;

/**
 * Dify 응답 스키마가 기대한 형식과 다를 때 발생.
 */
public class ResponseMappingException extends RuntimeException {

    public ResponseMappingException(String message) {
        super(message);
    }

    public ResponseMappingException(String message, Throwable cause) {
        super(message, cause);
    }
}
