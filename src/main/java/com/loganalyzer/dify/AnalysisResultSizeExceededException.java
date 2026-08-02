package com.loganalyzer.dify;

/**
 * Dify 분석 결과(content)가 1MB(1,048,576 bytes)를 초과할 때 발생.
 */
public class AnalysisResultSizeExceededException extends RuntimeException {

    public AnalysisResultSizeExceededException(String message) {
        super(message);
    }
}
