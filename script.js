const clientId = 'your_client_id';
const clientSecret = 'your_client_secret';

// Function to fetch access token
async function fetchAccessToken() {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials'
        })
    });
    const data = await response.json();
    return data.access_token;
}

// Function to fetch data from Twitch API
async function fetchTwitchData(endpoint, accessToken) {
    const response = await fetch(`https://api.twitch.tv/helix/${endpoint}`, {
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`
        }
    });
    return await response.json();
}

// Function to fetch user data
async function fetchUserData(userName, accessToken) {
    const userResponse = await fetchTwitchData(`users?login=${userName}`, accessToken);
    return userResponse.data[0];
}

// Function to fetch channels a user is following
async function fetchUserFollows(userId, accessToken) {
    const followsResponse = await fetchTwitchData(`users/follows?from_id=${userId}`, accessToken);
    return followsResponse.data;
}

// Function to fetch channel badges
async function fetchChannelBadges(channelId, accessToken) {
    const badgeResponse = await fetchTwitchData(`chat/badges?broadcaster_id=${channelId}`, accessToken);
    return badgeResponse.data;
}

// Function to fetch user's chat badges
async function fetchUserChatBadges(channelId, userId, accessToken) {
    const response = await fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${channelId}&user_id=${userId}`, {
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const data = await response.json();
    return data.data;
}

// Function to fetch global badges
async function fetchGlobalBadges(accessToken) {
    const badgeResponse = await fetchTwitchData('chat/badges/global', accessToken);
    return badgeResponse.data;
}

// Function to fetch and display streamer information
async function getStreamerInfo(userName) {
    const accessToken = await fetchAccessToken();
    const userData = await fetchUserData(userName, accessToken);
    if (!userData) {
        alert('Streamer not found');
        return;
    }

    // Profile Information
    const profileImage = document.getElementById('profile-image');
    const profileName = document.getElementById('profile-name');
    const profileDescription = document.getElementById('profile-description');
    const profileId = document.getElementById('profile-id');
    const profileLogin = document.getElementById('profile-login');
    const profileCreatedAt = document.getElementById('profile-created-at');

    profileImage.src = userData.profile_image_url;
    profileName.textContent = `Display Name: ${userData.display_name}`;
    profileDescription.textContent = `Description: ${userData.description}`;
    profileId.textContent = `ID: ${userData.id}`;
    profileLogin.textContent = `Login: ${userData.login}`;
    profileCreatedAt.textContent = `Created At: ${new Date(userData.created_at).toLocaleDateString()}`;

    // Live Stream Information
    const streamResponse = await fetchTwitchData(`streams?user_id=${userData.id}`, accessToken);
    const streamStatus = document.getElementById('stream-status');
    const streamTitle = document.getElementById('stream-title');
    const viewerCount = document.getElementById('viewer-count');

    if (streamResponse.data.length > 0) {
        streamStatus.textContent = 'Live';
        streamTitle.textContent = `Title: ${streamResponse.data[0].title}`;
        viewerCount.textContent = `Viewers: ${streamResponse.data[0].viewer_count}`;
    } else {
        streamStatus.textContent = 'Offline';
        streamTitle.textContent = '';
        viewerCount.textContent = '';
    }

    // Channel Badges
    const channelBadges = await fetchChannelBadges(userData.id, accessToken);
    const channelBadgesList = document.getElementById('channel-badges-list');
    channelBadgesList.innerHTML = '';
    channelBadges.forEach(badgeSet => {
        badgeSet.versions.forEach(version => {
            const li = document.createElement('li');
            li.classList.add('badge');
            li.innerHTML = `<img src="${version.image_url_1x}" alt="${badgeSet.set_id} badge">`;
            channelBadgesList.appendChild(li);
        });
    });

    // User's Chat Badges
    const userChatBadges = await fetchUserChatBadges(userData.id, userData.id, accessToken);
    const userBadgesList = document.getElementById('user-badges-list');
    userBadgesList.innerHTML = '';
    userChatBadges.forEach(badge => {
        const li = document.createElement('li');
        li.classList.add('badge');
        li.innerHTML = `<img src="${badge.image_url_1x}" alt="${badge.set_id} badge">`;
        userBadgesList.appendChild(li);
    });

    // Recent Followers
    const followersResponse = await fetchTwitchData(`users/follows?to_id=${userData.id}&first=5`, accessToken);
    const followersList = document.getElementById('followers-list');
    followersList.innerHTML = '';

    followersResponse.data.forEach(follower => {
        const li = document.createElement('li');
        li.textContent = follower.from_name;
        followersList.appendChild(li);
    });

    // Channels the User is Following
    const userFollows = await fetchUserFollows(userData.id, accessToken);
    const followingChannelsList = document.getElementById('following-channels-list');
    followingChannelsList.innerHTML = '';

    userFollows.forEach(follow => {
        const li = document.createElement('li');
        li.textContent = follow.to_name;
        followingChannelsList.appendChild(li);
    });
}

// Function to handle the search button click
function searchStreamer() {
    const streamerName = document.getElementById('streamer-name').value.trim();
    if (streamerName) {
        getStreamerInfo(streamerName);
    } else {
        alert('Please enter a streamer name');
    }
}

// Optionally, you can load a default streamer's info on page load
document.addEventListener('DOMContentLoaded', () => {
    // getStreamerInfo('default_streamer_name');
});