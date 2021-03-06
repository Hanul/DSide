DSide.Node = OBJECT({
	
	init : (inner, self) => {
		
		const HARD_CODED_URLS = [
			'218.38.19.34:8923',
			'175.207.29.151:8923',
			'218.38.12.135:8923',
			'218.38.12.134:8923',
			'218.38.19.48:8923',
			'218.38.19.49:8923',
			'49.247.128.219:8923',
			'34.202.162.93:8923',
			'35.159.18.198:8923',
			'35.234.34.128:8923'
		];
		
		// 현재 국제 표준시를 밀리세컨드 단위로
		let getNowUTC = self.getNowUTC = () => {
			
			// 국제 표준시
			let now = new Date();
			
			return now.getTime() + now.getTimezoneOffset() * 60000;
		};
		
		// 현재 노드의 URL
		let thisNodeURL;
		
		// 모든 노드들의 send 함수
		let sendToNodes = {};
		
		// 모든 클라이언트들의 send 함수
		let sendToClients = [];
		let sendToTargetClientMap = {};
		
		// 모든 노드들에게 전파합니다.
		let broadcastNode = (methodName, data) => {
			EACH(sendToNodes, (sendToNode) => {
				sendToNode({
					methodName : methodName,
					data : data
				});
			});
		};
		
		// 모든 대상 클라이언트들에게 전파합니다.
		let broadcastTargetClient = (methodName, target, data, nowClientSend) => {
			
			if (sendToTargetClientMap[target] !== undefined) {
				
				EACH(sendToTargetClientMap[target], (sendToClient) => {
					
					// 현재 클라이언트는 제외
					if (sendToClient !== nowClientSend) {
						
						sendToClient({
							methodName : methodName,
							data : data
						});
					}
				});
			}
		};
		
		// 다른 노드가 연결할 서버를 생성합니다.
		WEB_SOCKET_SERVER(WEB_SERVER(CONFIG.DSide.port), (clientInfo, on, off, send, disconnect) => {
			
			let loginToken;
			let signedAccountId;
			
			// 접속한 클라이언트의 IP를 반환합니다.
			on('getClientIp', (notUsing, ret) => {
				ret(clientInfo.ip);
			});
			
			// 실제로 연결된 노드 URL 목록을 반환합니다.
			on('getNodeURLs', (notUsing, ret) => {
				
				let nodeURLs = [];
				EACH(sendToNodes, (send, url) => {
					nodeURLs.push(url);
				});
				
				if (thisNodeURL !== undefined) {
					nodeURLs.push(thisNodeURL);
				}
				
				ret(nodeURLs.length === 0 ? HARD_CODED_URLS : nodeURLs);
			});
			
			// 노드의 버전을 반환합니다.
			on('getVersion', (notUsing, ret) => {
				ret(CONFIG.DSide.version);
			});
			
			// 노드의 현재 시간을 반환합니다.
			on('getNodeTime', (notUsing, ret) => {
				ret(getNowUTC());
			});
			
			// 노드가 연결되었습니다.
			on('connectNode', (port, ret) => {
				if (port !== undefined) {
					initNodeHandlers(clientInfo.ip, clientInfo.ip + ':' + port, on, send);
				}
			});
			
			// 노드의 계정 ID를 반환합니다.
			on('getAccountId', (notUsing, ret) => {
				ret(CONFIG.DSide.accountId);
			});
			
			// 데이터 저장소의 해시를 반환합니다.
			on('getStoreHash', (storeName, ret) => {
				
				let store = DSide.Store.getAllStores()[storeName];
				if (store !== undefined) {
					
					ret(store.getHash());
				}
			});
			
			// 데이터 저장소의 전체 데이터를 반환합니다.
			on('getStoreDataSet', (storeName, ret) => {
				
				let store = DSide.Store.getAllStores()[storeName];
				if (store !== undefined) {
					
					ret(store.getDataSet());
				}
			});
			
			// 대상이 있는 데이터 저장소의 해시를 반환합니다.
			on('getTargetStoreHash', (storeName, ret) => {
				
				let store = DSide.TargetStore.getAllStores()[storeName];
				if (store !== undefined) {
					
					ret(store.getHash());
				}
			});
			
			// 대상이 있는 데이터 저장소의 대상 해시 셋을 반환합니다.
			on('getTargetStoreTargetHashSet', (storeName, ret) => {
				
				let store = DSide.TargetStore.getAllStores()[storeName];
				if (store !== undefined) {
					
					ret(store.getTargetHashSet());
				}
			});
			
			// 대상이 있는 데이터 저장소의 대상에 해당하는 전체 데이터를 반환합니다.
			on('getTargetStoreDataSet', (params, ret) => {
				
				let storeName = params.storeName;
				let target = params.target;
				
				let store = DSide.TargetStore.getAllStores()[storeName];
				if (store !== undefined) {
					
					ret(store.getDataSet(target));
				}
			});
			
			// 보안 데이터 저장소의 해시를 반환합니다.
			on('getSecureStoreHash', (storeName, ret) => {
				
				let store = DSide.SecureStore.getAllStores()[storeName];
				if (store !== undefined) {
					
					ret(store.getHash());
				}
			});
			
			// 보안 데이터 저장소의 전체 데이터를 반환합니다.
			on('getSecureStoreDataSet', (storeName, ret) => {
				
				let store = DSide.SecureStore.getAllStores()[storeName];
				if (store !== undefined) {
					
					ret(store.getDataSet());
				}
			});
			
			// 대상이 있는 보안 데이터 저장소의 해시를 반환합니다.
			on('getSecureTargetStoreHash', (storeName, ret) => {
				
				let store = DSide.SecureTargetStore.getAllStores()[storeName];
				if (store !== undefined) {
					
					ret(store.getHash());
				}
			});
			
			// 대상이 있는 보안 데이터 저장소의 대상 해시 셋을 반환합니다.
			on('getSecureTargetStoreTargetHashSet', (storeName, ret) => {
				
				let store = DSide.SecureTargetStore.getAllStores()[storeName];
				if (store !== undefined) {
					
					ret(store.getTargetHashSet());
				}
			});
			
			// 대상이 있는 보안 데이터 저장소의 대상에 해당하는 전체 데이터를 반환합니다.
			on('getSecureTargetStoreDataSet', (params, ret) => {
				
				let storeName = params.storeName;
				let target = params.target;
				
				let store = DSide.SecureTargetStore.getAllStores()[storeName];
				if (store !== undefined) {
					
					ret(store.getDataSet(target));
				}
			});
			
			sendToClients.push(send);
			
			on('joinTarget', (target, ret) => {
				
				if (target.length <= 256) {
					
					if (sendToTargetClientMap[target] === undefined) {
						sendToTargetClientMap[target] = [];
					}
					
					if (CHECK_IS_IN({
						array : sendToTargetClientMap[target],
						value : send
					}) !== true) {
						sendToTargetClientMap[target].push(send);
					}
				}
			});
			
			on('exitTarget', (target, ret) => {
				
				if (sendToTargetClientMap[target] !== undefined) {
					
					REMOVE({
						array : sendToTargetClientMap[target],
						value : send
					});
					
					if (sendToTargetClientMap[target].length === 0) {
						delete sendToTargetClientMap[target];
					}
				}
			});
			
			on('__DISCONNECTED', () => {
				
				REMOVE({
					array : sendToClients,
					value : send
				});
				
				EACH(sendToTargetClientMap, (sendToTargetClients, target) => {
					
					REMOVE({
						array : sendToTargetClients,
						value : send
					});
					
					if (sendToTargetClients.length === 0) {
						delete sendToTargetClientMap[target];
					}
				});
			});
			
			// d 잔고를 가져옵니다.
			on('getDBalance', (accountId, ret) => {
				//REQUIRED: accountId
				
				if (accountId !== undefined) {
					ret(DSide.dStore.getBalance(accountId));
				}
			});
			
			// 계정 세부 내용을 저장합니다.
			on('saveAccountDetail', (params, ret) => {
				//REQUIRED: params
				//REQUIRED: params.data
				//REQUIRED: params.data.accountId
				//OPTIONAL: params.data.name
				//OPTIONAL: params.data.introduce
				//REQUIRED: params.data.createTime
				//REQUIRED: params.hash
				
				let result = DSide.AccountDetailStore.saveData(params);
				
				// 성공적으로 저장되면 모든 노드에 전파합니다.
				if (result.savedData !== undefined) {
					broadcastNode('saveAccountDetail', params);
				}
				
				ret(result);
			});
			
			// 계정의 세부 내용을 가져옵니다.
			on('getAccountDetail', (accountId, ret) => {
				//REQUIRED: accountId
				
				if (accountId !== undefined) {
					ret(DSide.AccountDetailStore.getAccountDetail(accountId));
				}
			});
			
			// 이름으로 계정을 찾습니다.
			on('findAccounts', (nameQuery, ret) => {
				//REQUIRED: nameQuery
				
				if (nameQuery !== undefined) {
					ret(DSide.AccountDetailStore.findAccounts(nameQuery));
				}
			});
			
			// 길드를 생성합니다.
			on('createGuild', (params, ret) => {
				//REQUIRED: params
				//REQUIRED: params.data
				//REQUIRED: params.data.accountId
				//REQUIRED: params.data.id
				//OPTIONAL: params.data.name
				//OPTIONAL: params.data.introduce
				//REQUIRED: params.data.createTime
				//REQUIRED: params.hash
				
				let result = DSide.GuildStore.saveData(params);
				
				// 성공적으로 저장되면 모든 노드에 전파합니다.
				if (result.savedData !== undefined) {
					broadcastNode('createGuild', params);
				}
				
				ret(result);
			});
			
			// 특정 유저가 가입한 길드 정보를 가져옵니다.
			on('getGuildHash', (guildId, ret) => {
				//REQUIRED: guildId
				
				if (guildId !== undefined) {
					ret(DSide.GuildStore.getGuildHash(guildId));
				}
			});
			
			// 길드 정보를 수정합니다.
			on('updateGuild', (params, ret) => {
				//REQUIRED: params
				//REQUIRED: params.data
				//REQUIRED: params.data.accountId
				//REQUIRED: params.data.id
				//OPTIONAL: params.data.name
				//OPTIONAL: params.data.introduce
				//REQUIRED: params.data.createTime
				//REQUIRED: params.hash
				
				let result = DSide.GuildStore.updateGuild(params);
				
				// 성공적으로 저장되면 모든 노드에 전파합니다.
				if (result.savedData !== undefined) {
					broadcastNode('updateGuild', params);
				}
				
				ret(result);
			});
			
			// 이름으로 길드를 찾습니다.
			on('findGuilds', (nameQuery, ret) => {
				//REQUIRED: nameQuery
				
				if (nameQuery !== undefined) {
					ret(DSide.GuildStore.findGuilds(nameQuery));
				}
			});
			
			// 길드 정보를 가져옵니다.
			on('getGuild', (guildId, ret) => {
				//REQUIRED: guildId
				
				if (guildId !== undefined) {
					ret(DSide.GuildStore.getGuild(guildId));
				}
			});
			
			// 특정 유저가 가입한 길드 ID를 가져옵니다.
			on('getAccountGuildId', (accountId, ret) => {
				//REQUIRED: accountId
				
				if (accountId !== undefined) {
					ret(DSide.GuildMemberStore.getAccountGuildId(accountId));
				}
			});
			
			// 회원수 순으로 길드 ID들을 가져옵니다.
			on('getGuildIdsByMemberCount', (notUsing, ret) => {
				ret(DSide.GuildMemberStore.getGuildIdsByMemberCount());
			});
			
			// 길드원들의 ID들을 가져옵니다.
			on('getGuildMemberIds', (guildId, ret) => {
				ret(DSide.GuildMemberStore.getGuildMemberIds(guildId));
			});
			
			// 길드 가입 신청합니다.
			on('requestGuildJoin', (params, ret) => {
				//REQUIRED: params
				//REQUIRED: params.data
				//REQUIRED: params.data.accountId
				//REQUIRED: params.data.target
				//REQUIRED: params.data.createTime
				//REQUIRED: params.hash
				
				let result = DSide.GuildJoinRequestStore.saveData(params);
				
				// 성공적으로 저장되면 모든 노드에 전파합니다.
				if (result.savedData !== undefined) {
					broadcastNode('requestGuildJoin', params);
				}
				
				ret(result);
			});
			
			// 이미 길드 가입 신청했는지 확인합니다.
			on('checkGuildJoinRequested', (params, ret) => {
				//REQUIRED: params
				//REQUIRED: params.accountId
				//REQUIRED: params.target
				
				if (params !== undefined) {
					ret(DSide.GuildJoinRequestStore.checkRequested(params));
				}
			});
			
			// 길드 가입 신청자 목록을 가져옵니다.
			on('getGuildJoinRequesterIds', (guildId, ret) => {
				//REQUIRED: guildId
				
				if (guildId !== undefined) {
					ret(DSide.GuildJoinRequestStore.getRequesterIds(guildId));
				}
			});
			
			// 길드 가입 신청을 거절합니다.
			on('denyGuildJoinRequest', (params, ret) => {
				//REQUIRED: params
				//REQUIRED: params.target
				//REQUIRED: params.accountId
				//REQUIRED: params.hash
				
				DSide.GuildJoinRequestStore.deny(params);
				
				// 모든 노드에 전파합니다.
				broadcastNode('denyGuildJoinRequest', params);
			});
			
			// 길드 가입 신청을 수락합니다.
			on('acceptGuildJoinRequest', (params, ret) => {
				//REQUIRED: params.id
				//REQUIRED: params.data
				//REQUIRED: params.data.target
				//REQUIRED: params.data.createTime
				//REQUIRED: params.hash
				
				DSide.GuildMemberStore.saveData(params);
				
				// 모든 노드에 전파합니다.
				broadcastNode('acceptGuildJoinRequest', params);
			});
			
			// 길드에서 탈퇴합니다.
			on('leaveGuild', (params, ret) => {
				//REQUIRED: params
				//REQUIRED: params.target
				//REQUIRED: params.id
				//REQUIRED: params.hash
				
				let result = DSide.GuildMemberStore.removeData(params);
				
				// 성공적으로 삭제되면 모든 노드에 전파합니다.
				if (result.originData !== undefined) {
					broadcastNode('leaveGuild', params);
				}
				
				ret(result);
			});
			
			// 길드를 삭제합니다.
			on('removeGuild', (params, ret) => {
				//REQUIRED: params
				//REQUIRED: params.hash
				//REQUIRED: params.checkHash
				
				let result = DSide.GuildStore.removeData(params);
				
				// 성공적으로 삭제되면 모든 노드에 전파합니다.
				if (result.originData !== undefined) {
					broadcastNode('removeGuild', params);
				}
				
				ret(result);
			});
			
			// 친구를 신청합니다.
			on('requestFriend', (params, ret) => {
				//REQUIRED: params
				//REQUIRED: params.data
				//REQUIRED: params.data.accountId
				//REQUIRED: params.data.target
				//REQUIRED: params.data.createTime
				//REQUIRED: params.hash
				
				let result = DSide.FriendRequestStore.saveData(params);
				
				// 성공적으로 저장되면 모든 노드에 전파합니다.
				if (result.savedData !== undefined) {
					broadcastNode('requestFriend', params);
				}
				
				ret(result);
			});
			
			// 이미 친구 신청했는지 확인합니다.
			on('checkFriendRequested', (params, ret) => {
				//REQUIRED: params
				//REQUIRED: params.accountId
				//REQUIRED: params.target
				
				if (params !== undefined) {
					ret(DSide.FriendRequestStore.checkRequested(params));
				}
			});
			
			// 친구 요청 목록을 가져옵니다.
			on('getFriendRequesterIds', (accountId, ret) => {
				//REQUIRED: accountId
				
				if (accountId !== undefined) {
					ret(DSide.FriendRequestStore.getRequesterIds(accountId));
				}
			});
			
			// 친구 요청을 거절합니다.
			on('denyFriendRequest', (params, ret) => {
				//REQUIRED: params
				//REQUIRED: params.target
				//REQUIRED: params.accountId
				//REQUIRED: params.hash
				
				DSide.FriendRequestStore.deny(params);
				
				// 모든 노드에 전파합니다.
				broadcastNode('denyFriendRequest', params);
			});
			
			// 친구 요청을 수락합니다.
			on('acceptFriendRequest', (params, ret) => {
				//REQUIRED: params
				//REQUIRED: params.data
				//REQUIRED: params.data.accountId
				//REQUIRED: params.data.account2Id
				//REQUIRED: params.data.createTime
				//REQUIRED: params.hash
				
				let result = DSide.FriendStore.saveData(params);
				
				// 성공적으로 저장되면 모든 노드에 전파합니다.
				if (result.savedData !== undefined) {
					broadcastNode('acceptFriendRequest', params);
				}
				
				ret(result);
			});
			
			// 친구를 삭제합니다.
			on('removeFriend', (params, ret) => {
				//REQUIRED: params
				//REQUIRED: params.friendId
				//REQUIRED: params.hash
				
				let result = DSide.FriendStore.removeData(params);
				
				// 성공적으로 삭제되면 모든 노드에 전파합니다.
				if (result.originData !== undefined) {
					broadcastNode('removeFriend', params);
				}
				
				ret(result);
			});
			
			// 친구 목록을 가져옵니다.
			on('getFriendIds', (accountId, ret) => {
				//REQUIRED: accountId
				
				if (accountId !== undefined) {
					ret(DSide.FriendStore.getFriendIds(accountId));
				}
			});
			
			// 두 유저가 친구인지 확인합니다.
			on('checkIsFriend', (params, ret) => {
				//REQUIRED: params
				//REQUIRED: params.accountId
				//REQUIRED: params.account2Id
				
				if (params !== undefined) {
					
					let accountId = params.accountId;
					let account2Id = params.account2Id;
					
					if (accountId !== undefined) {
						ret(CHECK_IS_IN({
							array : DSide.FriendStore.getFriendIds(accountId),
							value : account2Id
						}));
					}
				}
			});
			
			// 로그인 토큰을 생성합니다.
			on('generateLoginToken', (notUsing, ret) => {
				ret(loginToken = RANDOM_STR(24));
			});
			
			// 로그인합니다.
			on('login', (params, ret) => {
				
				let hash = params.hash;
				let accountId = params.accountId;
				
				// hash가 정상적으로 서명되었는지 검증합니다.
				if (DSide.Verify({
					accountId : accountId,
					data : loginToken,
					hash : hash
				}) === true) {
					signedAccountId = accountId;
					
					ret(true);
				} else {
					ret(false);
				}
			});
			
			// 채팅 메시지를 전달받습니다.
			on('sendChatMessage', (params) => {
				
				if (signedAccountId !== undefined && params !== undefined) {
					
					let target = params.target;
					let message = params.message;
					
					message = String(message).trim();
					
					if (message !== '') {
						
						let id = UUID();
						let data = {
							senderId : signedAccountId,
							target : target,
							message : message,
							createTime : new Date()
						};
						
						DSide.ChatStore.saveData({
							id : id,
							data : data
						});
						
						// 모든 노드들에게 전파합니다.
						broadcastNode('saveChatMessage', {
							id : id,
							data : data
						});
						
						let accountDetail = DSide.AccountDetailStore.getAccountDetail(data.senderId);
						
						if (accountDetail !== undefined) {
							data.senderName = accountDetail.name;
						}
						
						// 모든 대상 클라이언트들에게 전파합니다.
						broadcastTargetClient('newChatMessage', target, data, send);
					}
				}
			});
			
			// 채팅 메시지들을 가져옵니다.
			on('getChatMessages', (target, ret) => {
				
				let messages = [];
				
				EACH(DSide.ChatStore.getDataSet(target), (data) => {
					
					data = COPY(data);
					
					let accountDetail = DSide.AccountDetailStore.getAccountDetail(data.senderId);
					
					if (accountDetail !== undefined) {
						data.senderName = accountDetail.name;
					}
					
					messages.push(data);
				});
				
				messages.sort((a, b) => {
					if (a.createTime < b.createTime) {
						return -1;
					}
					if (a.createTime > b.createTime) {
						return 1;
					}
					return 0;
				});
				
				ret(messages);
			});
			
			// 처리중인 트랜잭션을 전달받습니다.
			on('sendPendingTransaction', (params) => {
				
				if (params !== undefined) {
					
					let target = params.target;
					let network = params.network;
					let transactionHash = params.transactionHash;
					let message = params.message;
					
					let id = UUID();
					let data = {
						target : target,
						network : network,
						transactionHash : transactionHash,
						message : message,
						createTime : new Date()
					};
					
					DSide.PendingTransactionStore.saveData({
						id : id,
						data : data
					});
					
					// 모든 노드들에게 전파합니다.
					broadcastNode('savePendingTransaction', {
						id : id,
						data : data
					});
					
					// 모든 대상 클라이언트들에게 전파합니다.
					broadcastTargetClient('newPendingTransaction', target, data, send);
				}
			});
			
			// 처리중인 트랜잭션들을 가져옵니다.
			on('getPendingTransactions', (target, ret) => {
				
				let transactions = [];
				
				EACH(DSide.PendingTransactionStore.getDataSet(target), (data) => {
					transactions.push(data);
				});
				
				ret(transactions);
			});
		});
		
		let initNodeHandlers = (clientIp, url, on, send) => {
			
			// 내 URL를 모른다면 가져옵니다.
			if (thisNodeURL === undefined) {
				
				send('getClientIp', (clientIp) => {
					
					// 현재 노드의 URL을 설정합니다.
					thisNodeURL = clientIp + ':' + CONFIG.DSide.port;
				});
			}
			
			sendToNodes[url] = send;
			
			// 운영 시작 시간을 기록합니다.
			DSide.NodeOperationTimeStore.saveData({
				id : url,
				data : {
					startOperationTime : new Date(),
					createTime : new Date()
				}
			});
			
			// 접속한 클라이언트의 IP를 반환합니다.
			on('getClientIp', (notUsing, ret) => {
				ret(clientIp);
			});
			
			// 계정 세부 내용을 저장합니다.
			on('saveAccountDetail', (params) => {
				if (params !== undefined) {
					DSide.AccountDetailStore.saveData(params);
				}
			});
			
			// 길드를 생성합니다.
			on('createGuild', (params) => {
				if (params !== undefined) {
					DSide.GuildStore.saveData(params);
				}
			});
			
			// 길드 정보를 수정합니다.
			on('updateGuild', (params) => {
				if (params !== undefined) {
					DSide.GuildStore.updateGuild(params);
				}
			});
			
			// 길드 가입 신청합니다.
			on('requestGuildJoin', (params) => {
				if (params !== undefined) {
					DSide.GuildJoinRequestStore.saveData(params);
				}
			});
			
			// 길드 가입 신청을 거절합니다.
			on('denyGuildJoinRequest', (params) => {
				if (params !== undefined) {
					DSide.GuildJoinRequestStore.deny(params);
				}
			});
			
			// 길드 가입 신청을 수락합니다.
			on('acceptGuildJoinRequest', (params) => {
				if (params !== undefined) {
					DSide.GuildMemberStore.saveData(params);
				}
			});
			
			// 길드에서 탈퇴합니다.
			on('leaveGuild', (params) => {
				if (params !== undefined) {
					DSide.GuildMemberStore.removeData(params);
				}
			});
			
			// 길드를 삭제합니다.
			on('removeGuild', (params) => {
				if (params !== undefined) {
					DSide.GuildStore.removeData(params);
				}
			});
			
			// 친구를 신청합니다.
			on('requestFriend', (params) => {
				if (params !== undefined) {
					DSide.FriendRequestStore.saveData(params);
				}
			});
			
			// 친구 요청을 거절합니다.
			on('denyFriendRequest', (params) => {
				if (params !== undefined) {
					DSide.FriendRequestStore.deny(params);
				}
			});
			
			// 친구 요청을 수락합니다.
			on('acceptFriendRequest', (params) => {
				if (params !== undefined) {
					DSide.FriendStore.saveData(params);
				}
			});
			
			// 친구를 삭제합니다.
			on('removeFriend', (params) => {
				if (params !== undefined) {
					DSide.FriendStore.removeData(params);
				}
			});
			
			// 채팅 메시지를 저장합니다.
			on('saveChatMessage', (params) => {
				if (params !== undefined) {
					
					let data = params.data;
					if (data !== undefined) {
						
						DSide.ChatStore.saveData(params);
						
						let accountDetail = DSide.AccountDetailStore.getAccountDetail(data.senderId);
						
						if (accountDetail !== undefined) {
							data.senderName = accountDetail.name;
						}
						
						// 모든 대상 클라이언트들에게 전파합니다.
						broadcastTargetClient('newChatMessage', data.target, data);
					}
				}
			});
			
			// 처리중인 트랜잭션을 저장합니다.
			on('savePendingTransaction', (params) => {
				if (params !== undefined) {
					
					let data = params.data;
					if (data !== undefined) {
						
						DSide.PendingTransactionStore.saveData(params);
						
						// 모든 대상 클라이언트들에게 전파합니다.
						broadcastTargetClient('newPendingTransaction', data.target, data);
					}
				}
			});
			
			on('__DISCONNECTED', () => {
				
				delete sendToNodes[url];
				
				DSide.NodeOperationTimeStore.getData(url, (data) => {
					
					delete data.startOperationTime;
					data.operationTime = Date.now() - data.startOperationTime.getTime();
					data.lastUpdateTime = new Date();
					
					// 운영 종료 시간을 기록합니다.
					DSide.NodeOperationTimeStore.updateData({
						id : url,
						data : data
					});
				});
			});
		};
		
		// 저장소의 싱크를 맞춥니다.
		let syncStore = (storeName, sendToNode) => {
			
			let store = DSide.Store.getAllStores()[storeName];
			if (store !== undefined) {
				
				sendToNode({
					methodName : 'getStoreHash',
					data : storeName
				}, (storeHash) => {
					
					// 해시값이 다르면 데이터 싱크를 시작합니다.
					if (store.getHash() !== storeHash) {
						
						sendToNode({
							methodName : 'getStoreDataSet',
							data : storeName
						}, (dataSet) => {
							
							let originDataSet = store.getDataSet();
							
							// 현재 없는 데이터면 생성
							EACH(dataSet, (data, id) => {
								if (originDataSet[id] === undefined) {
									store.syncData({
										id : id,
										data : data
									});
								}
							});
							
							// 노드에 없는 데이터면 삭제
							EACH(originDataSet, (data, id) => {
								if (dataSet[id] === undefined) {
									store.dropData(id);
								}
							});
						});
					}
				});
			}
		};
		
		// 대상이 존재하는 저장소의 싱크를 맞춥니다.
		let syncTargetStore = (storeName, sendToNode) => {
			
			let store = DSide.TargetStore.getAllStores()[storeName];
			if (store !== undefined) {
				
				sendToNode({
					methodName : 'getTargetStoreHash',
					data : storeName
				}, (storeHash) => {
					
					// 해시값이 다르면 데이터 싱크를 시작합니다.
					if (store.getHash() !== storeHash) {
						
						sendToNode({
							methodName : 'getTargetStoreTargetHashSet',
							data : storeName
						}, (targetHashSet) => {
							
							let originTargetHashSet = store.getTargetHashSet();
							
							// 대상 해시 셋을 비교합니다.
							EACH(targetHashSet, (hash, target) => {
								
								// 해시값이 다르면 내부 데이터를 비교합니다.
								if (originTargetHashSet[target] !== hash) {
									
									sendToNode({
										methodName : 'getTargetStoreDataSet',
										data : {
											storeName : storeName,
											target : target
										}
									}, (dataSet) => {
										
										let originDataSet = store.getDataSet(target);
										
										// 현재 없는 데이터면 생성
										EACH(dataSet, (data, id) => {
											if (originDataSet[id] === undefined) {
												store.syncData({
													id : id,
													// data 내에 target 존재
													data : data
												});
											}
										});
										
										// 노드에 없는 데이터면 삭제
										EACH(originDataSet, (data, id) => {
											if (dataSet[id] === undefined) {
												store.dropData({
													target : target,
													id : id
												});
											}
										});
									});
								}
							});
							
							// 노드에 없는 대상이면 삭제
							EACH(originTargetHashSet, (hash, target) => {
								if (targetHashSet[target] === undefined) {
									store.dropTarget(target);
								}
							});
						});
					}
				});
			}
		};
		
		// 보안 저장소의 싱크를 맞춥니다.
		let syncSecureStore = (storeName, sendToNode) => {
			
			let store = DSide.SecureStore.getAllStores()[storeName];
			if (store !== undefined) {
				
				sendToNode({
					methodName : 'getSecureStoreHash',
					data : storeName
				}, (storeHash) => {
					
					// 해시값이 다르면 데이터 싱크를 시작합니다.
					if (store.getHash() !== storeHash) {
						
						sendToNode({
							methodName : 'getSecureStoreDataSet',
							data : storeName
						}, (dataSet) => {
							
							let originDataSet = store.getDataSet();
							
							// 현재 없는 데이터면 생성
							EACH(dataSet, (data, hash) => {
								if (originDataSet[hash] === undefined) {
									store.syncData({
										hash : hash,
										data : data
									});
								}
							});
							
							// 노드에 없는 데이터면 삭제
							EACH(originDataSet, (data, hash) => {
								if (dataSet[hash] === undefined) {
									store.dropData(hash);
								}
							});
						});
					}
				});
			}
		};
		
		// 대상이 존재하는 보안 저장소의 싱크를 맞춥니다.
		let syncSecureTargetStore = (storeName, sendToNode) => {
			
			let store = DSide.SecureTargetStore.getAllStores()[storeName];
			if (store !== undefined) {
				
				sendToNode({
					methodName : 'getSecureTargetStoreHash',
					data : storeName
				}, (storeHash) => {
					
					// 해시값이 다르면 데이터 싱크를 시작합니다.
					if (store.getHash() !== storeHash) {
						
						sendToNode({
							methodName : 'getSecureTargetStoreTargetHashSet',
							data : storeName
						}, (targetHashSet) => {
							
							let originTargetHashSet = store.getTargetHashSet();
							
							// 대상 해시 셋을 비교합니다.
							EACH(targetHashSet, (hash, target) => {
								
								// 해시값이 다르면 내부 데이터를 비교합니다.
								if (originTargetHashSet[target] !== hash) {
									
									sendToNode({
										methodName : 'getSecureTargetStoreDataSet',
										data : {
											storeName : storeName,
											target : target
										}
									}, (dataSet) => {
										
										let originDataSet = store.getDataSet(target);
										
										// 현재 없는 데이터면 생성
										EACH(dataSet, (data, hash) => {
											if (originDataSet[hash] === undefined) {
												store.syncData({
													hash : hash,
													// data 내에 target 존재
													data : data
												});
											}
										});
										
										// 노드에 없는 데이터면 삭제
										EACH(originDataSet, (data, hash) => {
											if (dataSet[hash] === undefined) {
												store.dropData({
													target : target,
													hash : hash
												});
											}
										});
									});
								}
							});
							
							// 노드에 없는 대상이면 삭제
							EACH(originTargetHashSet, (hash, target) => {
								if (targetHashSet[target] === undefined) {
									store.dropTarget(target);
								}
							});
						});
					}
				});
			}
		};
		
		// 노드를 찾고 연결합니다.
		NEXT([
		
		// 하드코딩된 노드들의 URL로부터 최초 접속 노드를 찾습니다.
		(next) => {
			
			let isSomeNodeConnected = false;
			
			// 우선 하드코딩된 노드들의 URL에 연결을 시도합니다.
			EACH(HARD_CODED_URLS, (url) => {
				
				let splits = url.split(':');
				let host = splits[0];
				
				CONNECT_TO_WEB_SOCKET_SERVER({
					host : host,
					port : INTEGER(splits[1])
				}, {
					error : () => {
						// 연결 오류를 무시합니다.
					},
					success : (on, off, send, disconnect) => {
						
						if (isSomeNodeConnected !== true) {
							
							// 내 IP를 가져옵니다.
							send('getClientIp', (clientIp) => {
								
								// 내 스스로에는 연결 금지
								if (
								isSomeNodeConnected !== true &&
								host !== clientIp &&
								clientIp.substring(0, 8) !== '192.168.' &&
								clientIp !== '127.0.0.1' &&
								clientIp !== 'localhost') {
									
									// 실제로 연결된 노드 URL 목록을 가져옵니다.
									send('getNodeURLs', (nodeURLs) => {
										
										if (isSomeNodeConnected !== true) {
											
											// 현재 노드의 URL을 설정합니다.
											thisNodeURL = clientIp + ':' + CONFIG.DSide.port;
											
											next(nodeURLs);
											
											isSomeNodeConnected = true;
										}
										
										disconnect();
									});
								}
								
								else {
									disconnect();
								}
							});
						}
						
						else {
							disconnect();
						}
					}
				});
			});
		},
		
		// 최초 접속 노드로부터 모든 노드의 URL 목록을 가져와 연결합니다.
		() => {
			return (nodeURLs) => {
				
				let isFoundFastestNode;
				
				// 모든 노드들에 연결합니다.
				EACH(nodeURLs, (url) => {
					
					if (
					
					// 현재 노드와는 연결하지 않습니다.
					url !== thisNodeURL &&
					
					// 이미 연결되어있는 경우 연결하지 않습니다.
					sendToNodes[url] === undefined) {
						
						let splits = url.split(':');
						let host = splits[0];
						
						CONNECT_TO_WEB_SOCKET_SERVER({
							host : host,
							port : INTEGER(splits[1])
						}, {
							error : () => {
								// 연결 오류를 무시합니다.
							},
							success : (on, off, send, disconnect) => {
								
								send('getVersion', (version) => {
									
									// 버전이 같아야합니다.
									if (version === CONFIG.DSide.version) {
										
										// 노드에 연결합니다.
										send({
											methodName : 'connectNode',
											data : CONFIG.DSide.port
										});
										
										initNodeHandlers(host, url, on, send);
										
										// 가장 빠른 노드를 찾았습니다.
										if (isFoundFastestNode !== true) {
											
											// 가장 빠른 노드와 모든 저장소의 싱크를 맞춥니다.
											
											// 단일 저장소들의 싱크를 맞춥니다.
											EACH(DSide.Store.getAllStores(), (store, storeName) => {
												syncStore(storeName, send);
											});
											
											// 대상이 존재하는 저장소들의 싱크를 맞춥니다.
											EACH(DSide.TargetStore.getAllStores(), (store, storeName) => {
												syncTargetStore(storeName, send);
											});
											
											// 단일 보안 저장소들의 싱크를 맞춥니다.
											EACH(DSide.SecureStore.getAllStores(), (store, storeName) => {
												syncSecureStore(storeName, send);
											});
											
											// 대상이 존재하는 보안 저장소들의 싱크를 맞춥니다.
											EACH(DSide.SecureTargetStore.getAllStores(), (store, storeName) => {
												syncSecureTargetStore(storeName, send);
											});
											
											isFoundFastestNode = true;
										}
									}
									
									// 버전이 다르면 연결을 종료합니다.
									else {
										disconnect();
									}
								});
							}
						});
					}
				});
			};
		}]);
		
		// 가장 높은 가중지의 저장소와 싱크를 맞춥니다.
		let syncMaxWeightStore = (store, getStoreHashMethodName, storeName, syncStore) => {
			
			let storeHash = store.getHash();
			
			// 해시의 가중치를 수집합니다.
			let hashWeights = {};
			hashWeights[storeHash] = DSide.dStore.getBalance(CONFIG.DSide.accountId);
			
			// 각 해시들에 해당하는 노드들을 저장합니다.
			let hashSendToNodes = {};
			hashSendToNodes[storeHash] = [];
			
			PARALLEL(sendToNodes, [
			
			// 각 노드들에 저장소의 해시값을 요청합니다.
			(sendToNode, done) => {
				
				let isDone = false;
				
				sendToNode('getAccountId', (accountId) => {
					if (isDone !== true) {
						
						sendToNode({
							methodName : getStoreHashMethodName,
							data : storeName
						}, (hash) => {
							if (isDone !== true) {
								
								if (hashWeights[hash] === undefined) {
									hashWeights[hash] = 0;
								}
								
								// 해시의 가중치를 늘립니다.
								hashWeights[hash] += DSide.dStore.getBalance(accountId);
								
								if (hashSendToNodes[hash] === undefined) {
									hashSendToNodes[hash] = [];
								}
								
								hashSendToNodes[hash].push(sendToNode);
								
								done();
								isDone = true;
							}
						});
					}
				});
				
				// 요청의 타임아웃은 5초입니다.
				DELAY(5, () => {
					if (isDone !== true) {
						done();
						isDone = true;
					}
				});
			},
			
			() => {
				
				let maxWeight = -1;
				let maxWeightHash;
				
				// 가장 가중치가 높은 해시를 찾습니다.
				EACH(hashWeights, (weight, hash) => {
					
					if (maxWeight < weight) {
						weight = maxWeight;
						maxWeightHash = hash;
					}
				});
				
				EACH(hashSendToNodes[maxWeightHash], (sendToNode) => {
					
					if (CHECK_IS_IN({
						array : sendToNodes,
						value : sendToNode
					}) === true) {
						
						syncStore(storeName, sendToNode);
						return false;
					}
				});
			}]);
		};
		
		// 하루에 한 번 토큰을 지급하고, 모든 저장소의 싱크를 맞춥니다.
		INTERVAL(1, () => {
			
			let nowCal = CALENDAR(new Date(getNowUTC()));
			
			// 자정이 되면 실행
			if (nowCal.getHour() === 0 && nowCal.getMinute() === 0 && nowCal.getSecond() === 0) {
				
				// 토큰들을 지급합니다.
				
				// 초기 d 수량보다 부족한 계정들에 d를 충전합니다.
				DSide.dStore.chargeLacks();
				
				// 노드 운영 시간에 따라 d를 지급합니다.
				EACH(DSide.NodeOperationTimeStore.getDataSet(), (data, url) => {
					
					let sendToNode = sendToNodes[url];
					if (sendToNode !== undefined) {
						
						sendToNode('getAccountId', (accountId) => {
							
							DSide.dStore.chargeNodeReward({
								accountId : accountId,
								operationTime : DSide.NodeOperationTimeStore.getOperationTime(url)
							});
						});
					}
				});
				
				// 노드 운영 시간을 초기화합니다.
				DSide.NodeOperationTimeStore.clearOperationTimes();
				
				// 토큰을 지급하고 다른 네트워크에서 토큰들을 지급하기까지 5초간 대기한 후, 모든 저장소의 싱크를 맞춥니다.
				DELAY(5, () => {
					
					// 단일 저장소들의 싱크를 맞춥니다.
					EACH(DSide.Store.getAllStores(), (store, storeName) => {
						syncMaxWeightStore(store, 'getStoreHash', storeName, syncStore);
					});
					
					// 대상이 존재하는 저장소들의 싱크를 맞춥니다.
					EACH(DSide.TargetStore.getAllStores(), (store, storeName) => {
						syncMaxWeightStore(store, 'getTargetStoreHash', storeName, syncTargetStore);
					});
					
					// 단일 보안 저장소들의 싱크를 맞춥니다.
					EACH(DSide.SecureStore.getAllStores(), (store, storeName) => {
						syncMaxWeightStore(store, 'getSecureStoreHash', storeName, syncSecureStore);
					});
					
					// 대상이 존재하는 보안 저장소들의 싱크를 맞춥니다.
					EACH(DSide.SecureTargetStore.getAllStores(), (store, storeName) => {
						syncMaxWeightStore(store, 'getSecureTargetStoreHash', storeName, syncSecureTargetStore);
					});
				});
			}
		});
	}
});