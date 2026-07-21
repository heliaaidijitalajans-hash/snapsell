import { useCallback, useEffect, useRef, useState } from "react";

import {
  processingService as defaultService,
  type ProcessingService,
  type ProcessingSnapshot,
  COMPLETION_HOLD_MS,
  TICK_MS,
} from "../services/processing/processingService";

type UseProcessingOptions = {
  /** Runs the real `POST /api/photoroom/pipeline` job. Rejects on failure. */
  runJob: (signal: AbortSignal) => Promise<void>;
  /** Called after the completion hold once the job succeeded. */
  onComplete: () => void;
  /** Called when the job fails (not on user cancel). */
  onError: (error: unknown) => void;
  /** Called when the user cancels before success. */
  onCancel?: () => void;
  service?: ProcessingService;
};

/**
 * Website port of SnapSell Mobile `useProcessing` — drives the simulated
 * progress UI while the real pipeline request is in flight, soft-caps progress
 * at 92% until the backend settles, then holds the completed state briefly
 * before handing control back. Runs the job exactly once per mount.
 */
const softCapProgress = (
  service: ProcessingService,
  elapsedMs: number,
): ProcessingSnapshot => {
  const soft = service.snapshotAt(elapsedMs);
  if (soft.isComplete || soft.progress >= 0.92) {
    return {
      ...soft,
      activeIndex: Math.min(soft.activeIndex, service.pipeline.length - 1),
      completedCount: Math.min(
        soft.completedCount,
        service.pipeline.length - 1,
      ),
      progress: Math.min(soft.progress, 0.92),
      remainingMs: Math.max(soft.remainingMs, 1_000),
      isComplete: false,
    };
  }
  return soft;
};

export const useProcessing = ({
  runJob,
  onComplete,
  onError,
  onCancel,
  service = defaultService,
}: UseProcessingOptions) => {
  const [snapshot, setSnapshot] = useState<ProcessingSnapshot>(() =>
    service.snapshotAt(0),
  );
  const [canCancel, setCanCancel] = useState(true);

  const runJobRef = useRef(runJob);
  runJobRef.current = runJob;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  const cancelRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const startedAt = Date.now();
    let hasCompleted = false;
    let jobSucceeded = false;
    let apiSettled = false;
    let userLeft = false;
    let isMounted = true;
    let completionTimeout: ReturnType<typeof setTimeout> | undefined;
    const abortController = new AbortController();

    const finishSuccess = () => {
      if (hasCompleted) return;
      jobSucceeded = true;
      hasCompleted = true;
      if (isMounted) {
        setCanCancel(false);
        setSnapshot({
          activeIndex: service.pipeline.length,
          completedCount: service.pipeline.length,
          progress: 1,
          remainingMs: 0,
          isComplete: true,
        });
      }
      completionTimeout = setTimeout(() => {
        onCompleteRef.current();
      }, COMPLETION_HOLD_MS);
    };

    const fail = (error: unknown) => {
      if (hasCompleted || jobSucceeded || userLeft) return;
      hasCompleted = true;
      if (isMounted) setCanCancel(false);
      onErrorRef.current(error);
    };

    const requestCancel = () => {
      if (jobSucceeded || hasCompleted) {
        if (completionTimeout) {
          clearTimeout(completionTimeout);
          completionTimeout = undefined;
        }
        onCompleteRef.current();
        return;
      }
      userLeft = true;
      if (isMounted) setCanCancel(false);
      abortController.abort();
      (onCancelRef.current ?? (() => undefined))();
    };
    cancelRef.current = requestCancel;

    void runJobRef
      .current(abortController.signal)
      .then(() => {
        apiSettled = true;
        finishSuccess();
      })
      .catch((error: unknown) => {
        apiSettled = true;
        if (userLeft || jobSucceeded) return;
        fail(error);
      });

    const interval = setInterval(() => {
      if (hasCompleted || apiSettled || !isMounted) return;
      const elapsed = Date.now() - startedAt;
      setSnapshot(softCapProgress(service, elapsed));
    }, TICK_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (completionTimeout) clearTimeout(completionTimeout);
      if (!jobSucceeded) abortController.abort();
    };
    // Run once per mount — intentional single-run job.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  const cancel = useCallback(() => {
    cancelRef.current();
  }, []);

  return { snapshot, canCancel, cancel };
};
