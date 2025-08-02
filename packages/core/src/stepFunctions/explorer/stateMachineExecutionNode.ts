/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as os from 'os'
import * as nls from 'vscode-nls'
const localize = nls.loadMessageBundle()

import { ExecutionListItem } from '@aws-sdk/client-sfn'

import { getIcon, IconPath } from '../../shared/icons'
import { AWSResourceNode } from '../../shared/treeview/nodes/awsResourceNode'
import { AWSTreeNodeBase } from '../../shared/treeview/nodes/awsTreeNodeBase'

/**
 * Represents a single execution of a Step Functions state machine in the Explorer
 * view. This node appears immediately underneath the corresponding StateMachineNode.
 */
export class StateMachineExecutionNode extends AWSTreeNodeBase implements AWSResourceNode {
    public static contextValue = 'awsStateMachineExecutionNode'

    public constructor(
        public readonly parent: AWSTreeNodeBase,
        public override readonly regionCode: string,
        public details: ExecutionListItem
    ) {
        super('')
        this.update(details)
        this.contextValue = StateMachineExecutionNode.contextValue
    }

    public update(details: ExecutionListItem): void {
        this.details = details
        this.label = this.details.name || ''
        this.tooltip = this.getToolTip(this.details)
        this.iconPath = this.getIconPathForStatus(this.details.status)
    }

    public get arn(): string {
        return this.details.executionArn || ''
    }

    public get name(): string {
        return this.details.name || ''
    }

    private getIconPathForStatus(status?: string): IconPath {
        switch (status) {
            case 'RUNNING':
                return getIcon('aws-stepfunctions-execution-running')
            case 'SUCCEEDED':
                return getIcon('aws-stepfunctions-execution-success')
            default:
                return getIcon('aws-stepfunctions-execution-failed')
        }
    }

    private getToolTip(details: ExecutionListItem) {
        const startTimeText = localize('AWS.explorerNode.stepfunctions.startTime', 'Start Time')
        const endTimeText = localize('AWS.explorerNode.stepfunctions.endTime', 'End Time')
        const durationText = localize('AWS.explorerNode.stepfunctions.duration', 'Duration')

        let text: string = `${details.status}${os.EOL}${startTimeText}: ${details.startDate?.toLocaleTimeString()}${os.EOL}`
        if (details.status !== 'RUNNING') {
            text += `${endTimeText}: ${details.stopDate?.toLocaleTimeString()}${os.EOL}`
            const endDate = details.stopDate ? details.stopDate : new Date()
            text += `${durationText}: ${Math.trunc((endDate.getTime() - details.startDate!.getTime()) / 1000)} seconds`
        }
        return text
    }
}
