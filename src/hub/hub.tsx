import "azure-devops-ui/Core/override.css";
import "./hub.scss";

import * as SDK from "azure-devops-extension-sdk";
import { Dialog } from "azure-devops-ui/Dialog";
import { Header } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import { Panel } from "azure-devops-ui/Panel";
import { ZeroData, ZeroDataActionType } from "azure-devops-ui/ZeroData";
import * as React from "react";
import * as ReactDOM from "react-dom";

interface IHubState {
  dialogShown: boolean;
  panelShown: boolean;
}

class Hub extends React.Component<{}, IHubState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      dialogShown: false,
      panelShown: false
    };
  }

  public componentDidMount() {
    SDK.init();
  }

  public render(): JSX.Element {
    return (
      <Page className="flex-grow">
        <Header
          title="Hello Hub!"
          commandBarItems={[
            {
              id: "panel-button",
              text: "Open Panel",
              iconProps: {
                iconName: "World"
              },
              onActivate: () => this.togglePanel()
            }
          ]}
        />
        <ZeroData
          iconProps={{ iconName: "World" }}
          imageAltText="World image"
          primaryText="Hot Reload and Debug!"
          secondaryText={
            <span>
              Check out the{" "}
              <a
                rel="nofollow noopener"
                target="_blank"
                href="https://github.com/microsoft/azure-devops-extension-hot-reload-and-debug"
              >
                repo
              </a>{" "}
              to see how hot reload and debugging works.
            </span>
          }
          actionText="Open Dialog"
          actionType={ZeroDataActionType.ctaButton}
          onActionClick={() => this.toggleDialog()}
        />
        {this.state.dialogShown && (
          <Dialog
            className="flex-wrap"
            titleProps={{ text: "Hello Dialog!" }}
            onDismiss={() => this.toggleDialog()}
            footerButtonProps={[
              {
                text: "Close",
                primary: true,
                onClick: () => this.toggleDialog()
              }
            ]}
          >
            <ZeroData
              iconProps={{ iconName: "World" }}
              imageAltText="World image"
            />
          </Dialog>
        )}
        {this.state.panelShown && (
          <Panel
            titleProps={{ text: "Hello Panel!" }}
            onDismiss={() => this.togglePanel()}
            footerButtonProps={[
              {
                text: "Close",
                primary: true,
                onClick: () => this.togglePanel()
              }
            ]}
          >
            <ZeroData
              iconProps={{ iconName: "World" }}
              imageAltText="World image"
              className="flex-grow"
            />
          </Panel>
        )}
      </Page>
    );
  }

  private toggleDialog(): void {
    this.setState({ dialogShown: !this.state.dialogShown });
  }

  private togglePanel(): void {
    this.setState({ panelShown: !this.state.panelShown });
  }
}

ReactDOM.render(<Hub />, document.getElementById("root"));
