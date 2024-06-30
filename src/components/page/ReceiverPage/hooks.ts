import { useParams } from "next/navigation";
import { MutableRefObject, useCallback, useRef } from "react";
import { match } from "ts-pattern";

import { convertStreamerTextToReceiverText } from "@/models";
import { useMutationStates } from "@/states";
import { useDiary } from "@/states/diary";
import { sendTextToAI } from "@/usecase";
import { guardUndef } from "@/utils";

const FETCH_COUNT = 5;

export const useReceiver = () => {
    const {
        receiver: { receivedText, setReceivedText },
    } = useDiary();
    const {
        isMutating,
        mutatedLength,
        mutator: { startMutation, finishMutation },
    } = useMutationStates();

    const params = useParams();
    const id = parseInt(params.id[0], 10);

    const receivedTextRef = useRef<HTMLDivElement>(null);

    const updateText = useCallback(
        (mutatedText: string[]) => {
            setReceivedText((prevText) => [
                ...prevText.slice(0, mutatedLength),
                ...mutatedText,
                ...prevText.slice(mutatedLength + mutatedText.length),
            ]);
        },
        [setReceivedText, mutatedLength]
    );

    const mutateText = useCallback(
        async (targetText: string[]) => {
            startMutation();
            const res = await sendTextToAI(targetText, id);
            match(res)
                .with({ status: "ok" }, () => {
                    const mutatedText = guardUndef(res.val);
                    updateText(mutatedText);
                    finishMutation(mutatedText);
                })
                .with({ status: "err" }, () => {
                    console.log(res.err?.message);
                    finishMutation([]);
                });
        },
        [startMutation, updateText, finishMutation, id]
    );

    const handleInputChange = useCallback(
        async (clientTextRef: MutableRefObject<string>) => {
            const clientText = guardUndef(clientTextRef.current);
            const convertedClientText = convertStreamerTextToReceiverText(clientText);
            // 句読点と改行の数をカウント
            const mutateTarget = convertedClientText.slice(mutatedLength, -1);
            console.log(mutateTarget, mutatedLength);
            const count = mutateTarget.length;

            // 5回以上の場合は mutation 実行
            if (count >= FETCH_COUNT && !isMutating) {
                console.log(`句点または改行が5回以上入力されました。: ${mutateTarget}`);
                await mutateText(mutateTarget);
            }
        },
        [isMutating, mutateText, mutatedLength]
    );

    return {
        receivedTextRef,
        receivedText,
        handler: {
            handleInputChange,
        },
    };
};
