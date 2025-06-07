import { Listing, NotificationContent } from '../types';

export class NotificationFormatterService {
  formatNotification(listing: Listing): string {
    const content = this.prepareNotificationContent(listing);
    
    return `
🚀 *New ${content.type === 'bounty' ? 'Bounty' : 'Project'} Alert!*

*${this.escapeMarkdown(content.title)}*
by ${this.escapeMarkdown(content.sponsor)}

💰 *Reward:* ${content.reward}
⏰ *Deadline:* ${content.deadline}

${content.url}
`.trim();
  }

  private prepareNotificationContent(listing: Listing): NotificationContent {
    return {
      title: listing.title,
      sponsor: listing.sponsor_name,
      type: listing.type,
      reward: this.formatReward(listing),
      deadline: this.formatDeadline(listing.deadline),
      url: this.addUTMTracking(listing.url),
    };
  }

  private formatReward(listing: Listing): string {
    if (listing.is_variable_comp) {
      return 'Variable Comp';
    }

    if (listing.min_reward_usd !== undefined && listing.max_reward_usd !== undefined) {
      // Range compensation
      return `$${this.formatNumber(listing.min_reward_usd)} - $${this.formatNumber(listing.max_reward_usd)} USD`;
    }

    if (listing.reward_usd_value) {
      // Fixed compensation with USD value
      let reward = `$${this.formatNumber(listing.reward_usd_value)} USD`;
      
      if (listing.reward_token && listing.reward_amount) {
        reward = `${this.formatNumber(listing.reward_amount)} ${listing.reward_token} (~${reward})`;
      }
      
      return reward;
    }

    if (listing.reward_amount && listing.reward_token) {
      // Token amount without USD value
      return `${this.formatNumber(listing.reward_amount)} ${listing.reward_token}`;
    }

    return 'See listing for details';
  }

  private formatDeadline(deadline: Date): string {
    const now = new Date();
    const daysUntilDeadline = Math.floor(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDeadline < 0) {
      return 'Expired';
    } else if (daysUntilDeadline === 0) {
      return 'Today';
    } else if (daysUntilDeadline === 1) {
      return 'Tomorrow';
    } else if (daysUntilDeadline <= 7) {
      return `${daysUntilDeadline} days`;
    } else {
      return deadline.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: deadline.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  }

  private addUTMTracking(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}utm_source=telegrambot`;
  }

  private formatNumber(num: number): string {
    return num.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });
  }

  private escapeMarkdown(text: string): string {
    // Escape special characters for Telegram Markdown
    return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
  }

  // Format a batch summary for multiple notifications
  formatBatchSummary(count: number): string {
    return `
📊 *Notification Summary*

You have ${count} new ${count === 1 ? 'opportunity' : 'opportunities'} matching your preferences!
Check them out above 👆
`.trim();
  }

  // Format error message for failed notifications
  formatErrorMessage(): string {
    return `
⚠️ We encountered an issue sending your notification. 
Please check your preferences or contact support if the issue persists.
`.trim();
  }
}